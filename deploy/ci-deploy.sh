#!/usr/bin/env bash
# [POS] 博客静态产物部署入口，保留旧哈希资源用于回滚与旧标签页。
# [INPUT] .github/workflows/deploy.yml (POS: 前端构建与传输流程)
# [OUTPUT] 先复制资源再原子替换首页并验证，失败恢复旧入口。
set -Eeuo pipefail
incoming=${1:?Incoming directory required}
sha=${2:?Commit SHA required}
run=${3:?Run identifier required}
[[ "$sha" =~ ^[a-f0-9]{40}$ && "$run" =~ ^[0-9]+-[0-9]+$ ]]
[[ "$incoming" == "/tmp/evanlink-ci-$sha-$run" ]]
exec 9>/var/lock/evanlink-release.lock
echo "Waiting for server release lock (up to 10 minutes)"
flock -w 600 9
echo "Release lock acquired"
site=/opt/evanlink-frontend/html
backup="/opt/evanlink-frontend/backups/ci-$sha-$run"
install -d -m 700 /opt/evanlink-frontend/backups
mkdir -m 700 "$backup"
cp -p "$site/index.html" "$backup/index.html"
stage="$incoming/stage"
mkdir "$stage"
tar -xzf "$incoming/frontend.tar.gz" -C "$stage"
test -f "$stage/index.html"
test -d "$stage/assets"
mapfile -t assets < <(grep -oE '/assets/[^" ]+\.(js|css)' "$stage/index.html")
test "${#assets[@]}" -gt 0
for asset in "${assets[@]}"; do test -f "$stage$asset"; done
cp -a "$stage/assets/." "$site/assets/"
# 同步根静态文件，但不触碰站点证书续期目录与单独上传的博客图片。
find "$stage" -mindepth 1 -maxdepth 1 ! -name assets ! -name index.html ! -name .well-known -exec cp -a {} "$site/" \;
restore() {
  status=$?
  if (( status != 0 )); then
    install -m 644 "$backup/index.html" "$site/index.html.rollback"
    mv -f "$site/index.html.rollback" "$site/index.html"
    echo "Frontend deployment failed. Previous entry restored." >&2
  fi
  exit "$status"
}
trap restore EXIT
install -m 644 "$stage/index.html" "$site/index.html.next"
mv -f "$site/index.html.next" "$site/index.html"
online=$(curl -fsS --max-time 15 https://evanlink.cn/chat)
for asset in "${assets[@]}"; do
  grep -Fq "$asset" <<< "$online"
  curl -fsS --max-time 15 -o /dev/null "https://evanlink.cn$asset"
done
echo "Frontend deployed: $sha"
