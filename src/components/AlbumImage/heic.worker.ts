import { heicTo } from 'heic-to/next'

// 解码放在独立 Worker 中；完成或取消后由调用方销毁，释放解码器内存。
self.onmessage = async (event: MessageEvent<Blob>) => {
  try {
    const jpeg = await heicTo({ blob: event.data, type: 'image/jpeg', quality: 0.88 })
    self.postMessage({ jpeg })
  } catch {
    self.postMessage({ error: '这张 HEIC 照片暂时无法解析，请转换为 JPG 后重试' })
  }
}
