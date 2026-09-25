import { Presenter } from "@/components/presenter/Presenter";

export default async function PresentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Presenter id={id} />;
}
