import { error, json, type RequestHandler } from "@sveltejs/kit";
import crowdin, { type Credentials, SourceFilesModel } from "@crowdin/crowdin-api-client";

// Interacts with Crowdin API to get translations

export const GET: RequestHandler = ({}) => {
  return json({});
};
