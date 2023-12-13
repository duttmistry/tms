export interface iProjectDocuments {
  id?: number;
  workspace_id: number;
  project_id: number;
  doc_title: string;
  doc_content: Text;
  doc_url: string;
  authorized_users: Array<number>;
  created_by: number;
  last_edited_by: number;
}
export interface iProjectDocumentChangeLogs {
  id?: number;
  document_id: number;
  previous_content: string;
  updated_content: Text;
  updated_by: number;
}
