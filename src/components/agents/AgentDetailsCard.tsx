import { FullAgent } from "@/types/agent";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface AgentDetailsCardProps {
  agent: FullAgent;
}

const AgentDetailsCard = ({ agent }: AgentDetailsCardProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl">{agent.name}</CardTitle>
            <CardDescription className="mt-2">
              {agent.description}
            </CardDescription>
          </div>
          <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full overflow-hidden">
            {agent.avatar ? (
              <img
                src={agent.avatar.url}
                alt={agent.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-2xl font-bold text-primary">
                {agent.name.charAt(0)}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">AI Model</p>
                <p className="font-medium">{agent.iaModel.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Language</p>
                <p className="font-medium">{agent.language}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time Zone</p>
                <p className="font-medium">{agent.timeZone}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-medium mb-2">Initial Message</h3>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="italic">"{agent.initialMessage}"</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-medium mb-2">Prompt & Context</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p>{agent.prompt.description}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Goal</p>
                <p>{agent.prompt.goal}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Skills</p>
                <p>{agent.prompt.habilities}</p>
              </div>

              <div className="pt-2">
                <p className="text-sm text-muted-foreground mb-1">
                  Company Information
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-medium">{agent.prompt.companyName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sector</p>
                    <p className="font-medium">{agent.prompt.companySector}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-muted-foreground">Website</p>
                    <p className="font-medium">
                      <a
                        href={agent.prompt.companySite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {agent.prompt.companySite}
                      </a>
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-muted-foreground">Description</p>
                    <p>{agent.prompt.companyDescription}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-medium mb-2">Knowledge Content</h3>
            {agent.contents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No content added</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {agent.contents.map((content) => (
                  <Badge key={content.id} variant="secondary">
                    {content.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* <div>
            <h3 className="text-lg font-medium mb-2">Custom Fields</h3>
            {agent.customFields.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No custom fields defined
              </p>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2 text-sm font-medium">
                        Name
                      </th>
                      <th className="text-left p-2 text-sm font-medium">
                        Label
                      </th>
                      <th className="text-left p-2 text-sm font-medium">
                        Type
                      </th>
                      <th className="text-left p-2 text-sm font-medium">
                        Required
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {agent.customFields.map((field, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">
                          <code className="bg-muted/50 px-1 py-0.5 rounded text-sm">
                            {field.name}
                          </code>
                        </td>
                        <td className="p-2">{field.label}</td>
                        <td className="p-2">
                          <Badge variant="outline">{field.type}</Badge>
                        </td>
                        <td className="p-2">
                          {field.required ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              Required
                            </Badge>
                          ) : (
                            <Badge variant="outline">Optional</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div> */}
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentDetailsCard;
