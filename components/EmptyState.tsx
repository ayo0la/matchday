export default function EmptyState({ message = 'No matches found.' }: { message?: string }) {
  return (
    <div style={{ padding: '32px 24px', color: '#444444', fontSize: 13, textAlign: 'center' }}>
      {message}
    </div>
  )
}
