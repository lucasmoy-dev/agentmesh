import WorkflowEditor from "@/components/WorkflowEditor";

export default async function WorkflowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: '280px', // Anchura de la sidebar
      right: 0, 
      bottom: 0, 
      zIndex: 100,
      backgroundColor: '#0a0a0c'
    }}>
      <WorkflowEditor workflowId={id} />
    </div>
  );
}
