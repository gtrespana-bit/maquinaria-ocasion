import { embedDeVideo, normalizarVideoUrl } from '@/lib/video-embed'

test('YouTube en todas sus formas embebe con nocookie', () => {
  expect(embedDeVideo('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toEqual({
    tipo: 'iframe',
    src: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
  })
  expect(embedDeVideo('https://youtu.be/dQw4w9WgXcQ')).toEqual({
    tipo: 'iframe',
    src: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
  })
  expect(embedDeVideo('https://www.youtube.com/shorts/abcDE12345')).toEqual({
    tipo: 'iframe',
    src: 'https://www.youtube-nocookie.com/embed/abcDE12345',
  })
  expect(embedDeVideo('https://www.youtube-nocookie.com/embed/abcDE12345')).toEqual({
    tipo: 'iframe',
    src: 'https://www.youtube-nocookie.com/embed/abcDE12345',
  })
})

test('Vimeo y Google Drive embeben', () => {
  expect(embedDeVideo('https://vimeo.com/123456789')).toEqual({ tipo: 'iframe', src: 'https://player.vimeo.com/video/123456789' })
  expect(embedDeVideo('https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUv/view?usp=sharing')).toEqual({
    tipo: 'iframe',
    src: 'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUv/preview',
  })
})

test('Otras URLs válidas quedan como enlace normal', () => {
  expect(embedDeVideo('https://ejemplo.com/mi-video')).toEqual({ tipo: 'enlace', href: 'https://ejemplo.com/mi-video' })
})

test('basura, vacío o javascript: devuelven null', () => {
  expect(embedDeVideo('')).toBeNull()
  expect(embedDeVideo(null)).toBeNull()
  expect(embedDeVideo(12345)).toBeNull()
  expect(embedDeVideo('javascript:alert(1)')).toBeNull()
  expect(embedDeVideo('no es una url')).toBeNull()
})

test('normalizarVideoUrl añade https y respeta el límite', () => {
  expect(normalizarVideoUrl('example.com/a')).toBe('https://example.com/a')
  expect(normalizarVideoUrl('x'.repeat(600))).toBeNull()
})
