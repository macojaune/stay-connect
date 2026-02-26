type ServerErrorProps = {
  message?: string
  requestId?: string
  error?: {
    message?: string
  }
}

export default function ServerError(props: ServerErrorProps) {
  const message =
    props.message ?? props.error?.message ?? 'Une erreur serveur est survenue. Merci de reessayer.'

  return (
    <>
      <div className="container">
        <div className="title">Server Error</div>

        <span>{message}</span>
        {props.requestId ? <small>Ref: {props.requestId}</small> : null}
      </div>
    </>
  )
}
