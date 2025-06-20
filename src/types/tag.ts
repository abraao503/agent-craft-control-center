export type Tag = {
  id: string;
  name: string;
  color: string;
  workspaceId: string;
};

export type TagLinkRequest = {
  tagId: string;
  chatId: string;
  workspaceId: string;
};
