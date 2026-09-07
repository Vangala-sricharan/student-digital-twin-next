import { handleAssistantRequest } from '../_handlers/ai/assistant';

export default async function handler(req: any, res: any) {
  return handleAssistantRequest(req, res);
}
