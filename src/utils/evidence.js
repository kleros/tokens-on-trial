const getFileIcon = type => {
  switch (type.slice(0, 5)) {
    case 'image':
      return 'file-image'
    case 'video':
      return 'file-video'
    case 'audio':
      return 'file-audio'
    default:
      break
  }

  switch (type) {
    case 'application/pdf':
      return 'file-pdf'
    case 'application/msword':
      return 'file-word'
    default:
      return 'file'
  }
}

export { getFileIcon }
