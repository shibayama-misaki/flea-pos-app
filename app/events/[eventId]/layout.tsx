import EventHeader from "@/components/header/EventHeader"

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params

  return (
    <>
      <EventHeader eventId={eventId} />
      {children}
    </>
  )
}