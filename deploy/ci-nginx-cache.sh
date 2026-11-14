#!/usr/bin/env bash
# CI 自动应用前端缓存策略，失败恢复原配置，不重启业务服务。
set -Eeuo pipefail
incoming=${1:?Incoming directory required}
backup=${2:?Backup directory required}
config=/etc/nginx/conf.d/evanlink.cn.conf
snippet=/etc/nginx/snippets/evanlink-frontend-cache.conf
cp -p "$config" "$backup/nginx-site.conf"
if test -f "$snippet"; then cp -p "$snippet" "$backup/nginx-cache.conf"; fi
restore() {
  status=$?
  if (( status != 0 )); then
    cp -p "$backup/nginx-site.conf" "$config"
    if test -f "$backup/nginx-cache.conf"; then cp -p "$backup/nginx-cache.conf" "$snippet"; else rm -f "$snippet"; fi
    nginx -t && systemctl reload nginx || true
    echo 'Nginx cache update failed; previous configuration restored' >&2
  fi
  exit "$status"
}
trap restore EXIT
if ! grep -Fq "include $snippet;" "$config"; then
  # 不覆盖用户已有同路径规则，避免产生重复 location。
  if grep -Eq 'location[[:space:]]+(=[[:space:]]+)?/index.html|location[[:space:]]+(\^~[[:space:]]+)?/assets/' "$config"; then
    echo 'Existing frontend cache locations require an explicit merge' >&2; exit 1
  fi
  test "$(grep -Ec '^[[:space:]]*index[[:space:]]+index.html;' "$config" || true)" -eq 1
  sed -i '\|^[[:space:]]*index[[:space:]]\+index.html;|a\      include /etc/nginx/snippets/evanlink-frontend-cache.conf;' "$config"
fi
install -d -m 755 /etc/nginx/snippets
install -m 644 "$incoming/nginx-frontend-cache.conf" "$snippet"
nginx -t
systemctl reload nginx
touch "$backup/nginx-cache-applied"
