export const required = name => v => (v ? undefined : `${name} is required.`)

export const ETHAddress = ethAddr => v =>
  /^0x[a-fA-F0-9]{40}$/.test(v)
    ? undefined
    : `${ethAddr} must be a valid ethereum address.`

export const email = name => v =>
  /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i.test(
    v
  )
    ? undefined
    : `${name} must be a valid email.`
