export default function ErrorState({ message = "Couldn't load data — retrying..." }: { message?: string }) {
  return (
    <div style={{ padding: '16px 24px', color: '#A50044', fontSize: 13 }}>
      {message}
    </div>
  )
}
