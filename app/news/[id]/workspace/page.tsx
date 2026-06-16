import StoryWorkspace from '@/components/news/StoryWorkspace'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <StoryWorkspace storyId={id} />
}
