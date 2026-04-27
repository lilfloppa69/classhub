function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })
}

export async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  const diameter = Math.min(pixelCrop.width, pixelCrop.height)
  canvas.width = diameter
  canvas.height = diameter

  ctx.beginPath()
  ctx.arc(diameter / 2, diameter / 2, diameter / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    diameter,
    diameter,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'))
        return
      }

      const file = new File([blob], `avatar-${Date.now()}.png`, {
        type: 'image/png',
      })

      resolve({
        file,
        previewUrl: URL.createObjectURL(blob),
      })
    }, 'image/png')
  })
}
