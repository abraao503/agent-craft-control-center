export type Content = {
  id: string;
  name: string;
  type: "file" | "answersQuestions";
  createdAt: Date;
  updatedAt: Date;
};

export type ListContentResponse = {
  contents: Content[];
};

export type CreateContentRequest = {
  name: string;
  type: "file";
  fileId: string;
};
