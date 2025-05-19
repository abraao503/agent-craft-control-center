import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AgentFormData, FollowUp, UpdateFollowUpAction, CreateFollowUp, UpdateFollowUp, DeleteFollowUp } from "@/types/agent";
import { PlusCircle, Trash2, Edit, Plus } from "lucide-react";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

interface FollowUpsProps {
  formData: AgentFormData;
  updateFormData: (data: Partial<AgentFormData>) => void;
  setFollowUpsToUpdate?: React.Dispatch<React.SetStateAction<UpdateFollowUpAction[]>>;
}

const followUpSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  description: z.string().min(3, "Descrição deve ter pelo menos 3 caracteres"),
  days: z.number().int().min(0, "Dias não pode ser negativo").max(14, "Máximo de 14 dias permitido"),
  hours: z.number().int().min(0, "Horas não pode ser negativo").max(23, "Máximo de 23 horas permitido"),
  minutes: z.number().int().min(0, "Minutos não pode ser negativo").max(59, "Máximo de 59 minutos permitido"),
});

const FollowUps = ({ formData, updateFormData, setFollowUpsToUpdate }: FollowUpsProps) => {
  const [newFollowUp, setNewFollowUp] = useState<Partial<FollowUp>>({
    name: "",
    description: "",
    days: 0,
    hours: 1,
    minutes: 0,
    delaySeconds: 3600, // 1 hora em segundos
  });
  const [editingFollowUp, setEditingFollowUp] = useState<{index: number, followUp: FollowUp} | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [followUpToDelete, setFollowUpToDelete] = useState<number | null>(null);
  
  // Usamos um estado para controlar se já processamos os follow ups
  const [processed, setProcessed] = useState(false);
  
  // Processa os follow ups existentes para garantir que tenham os campos de dia, hora e minutos
  useEffect(() => {
    if (!processed && formData.followUps && formData.followUps.length > 0) {
      const needsUpdate = formData.followUps.some(
        followUp => followUp.days === undefined || followUp.hours === undefined || followUp.minutes === undefined
      );
      
      if (needsUpdate) {
        const updatedFollowUps = formData.followUps.map(followUp => {
          // Se já tiver os campos de tempo, não precisa atualizar
          if (followUp.days !== undefined && followUp.hours !== undefined && followUp.minutes !== undefined) {
            return followUp;
          }
          
          // Converte segundos para dias, horas e minutos
          const { days, hours, minutes } = secondsToTimeUnits(followUp.delaySeconds);
          return {
            ...followUp,
            days,
            hours,
            minutes
          };
        });
        
        updateFormData({ followUps: updatedFollowUps });
      }
      
      setProcessed(true);
    }
  }, [formData.followUps, processed]);  // Dependências corrigidas

  // Função para converter dias, horas e minutos para segundos
  const calculateDelaySeconds = (days: number, hours: number, minutes: number) => {
    return days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60;
  };

  // Função para converter segundos para dias, horas e minutos
  const secondsToTimeUnits = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    return { days, hours, minutes };
  };

  const validateFollowUp = (followUp: Partial<FollowUp>) => {
    try {
      followUpSchema.parse(followUp);
      
      // Verifica se pelo menos um dos campos de tempo tem valor
      const totalSeconds = calculateDelaySeconds(
        followUp.days || 0,
        followUp.hours || 0,
        followUp.minutes || 0
      );
      
      if (totalSeconds <= 0) {
        setErrors({ time: "O tempo de atraso deve ser maior que zero" });
        return false;
      }
      
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleAddFollowUp = () => {
    if (validateFollowUp(newFollowUp)) {
      // Calcula o total de segundos a partir dos campos de dia, hora e minuto
      const delaySeconds = calculateDelaySeconds(
        newFollowUp.days || 0,
        newFollowUp.hours || 0,
        newFollowUp.minutes || 0
      );
      
      // Verifica se estamos editando ou criando um novo follow up
      if (editingFollowUp) {
        // Estamos editando um follow up existente
        const updatedFollowUp: FollowUp = {
          ...editingFollowUp.followUp,
          name: newFollowUp.name || "",
          description: newFollowUp.description || "",
          delaySeconds,
          days: newFollowUp.days || 0,
          hours: newFollowUp.hours || 0,
          minutes: newFollowUp.minutes || 0
        };
        
        // Atualiza o array de follow ups
        const updatedFollowUps = [...formData.followUps];
        updatedFollowUps[editingFollowUp.index] = updatedFollowUp;
        
        // Atualiza o estado local
        updateFormData({
          followUps: updatedFollowUps,
        });
        
        // Se estamos na página de edição e o follow up tem ID, rastrear a ação de atualização para o backend
        if (setFollowUpsToUpdate && updatedFollowUp.id) {
          const updateAction: UpdateFollowUp = {
            action: 'update',
            followUpId: updatedFollowUp.id,
            followUp: {
              name: updatedFollowUp.name,
              description: updatedFollowUp.description,
              delaySeconds: updatedFollowUp.delaySeconds
            }
          };
          
          setFollowUpsToUpdate(prev => [...prev, updateAction]);
        }
        
        // Limpa o estado de edição
        setEditingFollowUp(null);
        
        toast({
          title: "Follow up atualizado",
          description: "O follow up foi atualizado com sucesso.",
        });
      } else {
        // Estamos criando um novo follow up
        const followUpToAdd: FollowUp = {
          name: newFollowUp.name || "",
          description: newFollowUp.description || "",
          delaySeconds,
          days: newFollowUp.days || 0,
          hours: newFollowUp.hours || 0,
          minutes: newFollowUp.minutes || 0
        };
        
        // Atualiza o estado local
        updateFormData({
          followUps: [...formData.followUps, followUpToAdd],
        });
        
        // Se estamos na página de edição, rastrear a ação de criação para o backend
        if (setFollowUpsToUpdate) {
          const createAction: CreateFollowUp = {
            action: 'create',
            followUp: {
              name: followUpToAdd.name,
              description: followUpToAdd.description,
              delaySeconds: followUpToAdd.delaySeconds
            }
          };
          
          setFollowUpsToUpdate(prev => [...prev, createAction]);
        }
        
        toast({
          title: "Follow up adicionado",
          description: "O follow up foi adicionado com sucesso.",
        });
      }
      
      // Reseta o formulário
      setNewFollowUp({
        name: "",
        description: "",
        days: 0,
        hours: 1,
        minutes: 0,
        delaySeconds: 3600, // 1 hora em segundos
      });
      
      setErrors({});
    }
  };

  const openDeleteModal = (index: number) => {
    setFollowUpToDelete(index);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setFollowUpToDelete(null);
  };

  const handleRemoveFollowUp = () => {
    if (followUpToDelete === null) return;
    
    const index = followUpToDelete;
    const followUpToRemove = formData.followUps[index];
    const updatedFollowUps = [...formData.followUps];
    updatedFollowUps.splice(index, 1);
    updateFormData({ followUps: updatedFollowUps });
    
    // Se estamos na página de edição e o follow up tem ID, rastrear a ação de remoção para o backend
    if (setFollowUpsToUpdate && followUpToRemove.id) {
      const deleteAction: DeleteFollowUp = {
        action: 'delete',
        followUpId: followUpToRemove.id
      };
      
      setFollowUpsToUpdate(prev => [...prev, deleteAction]);
    }
    
    toast({
      title: "Follow up removido",
      description: "O follow up foi removido com sucesso.",
    });
    
    closeDeleteModal();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: keyof FollowUp
  ) => {
    let value: string | number = e.target.value;
    
    // Converte para número se for um campo numérico
    if (field === "days" || field === "hours" || field === "minutes") {
      // Remove zeros à esquerda do valor de entrada
      if (typeof value === 'string' && value.startsWith('0') && value.length > 1) {
        value = value.replace(/^0+/, '');
        // Se o campo for modificado para ter zeros à esquerda, atualizamos o valor no input
        // para remover esses zeros imediatamente
        if (e.target instanceof HTMLInputElement) {
          e.target.value = value;
        }
      }
      
      value = parseInt(value, 10) || 0;
      
      // Aplica limites específicos para cada campo
      if (field === "days" && (value as number) > 14) {
        value = 14;
      } else if (field === "hours" && (value as number) > 23) {
        value = 23;
      } else if (field === "minutes" && (value as number) > 59) {
        value = 59;
      }
      
      // Atualiza o valor de delaySeconds sempre que um dos campos de tempo mudar
      setNewFollowUp((prev) => {
        const days = field === "days" ? (value as number) : (prev.days || 0);
        const hours = field === "hours" ? (value as number) : (prev.hours || 0);
        const minutes = field === "minutes" ? (value as number) : (prev.minutes || 0);
        const delaySeconds = calculateDelaySeconds(days, hours, minutes);
        
        return { ...prev, [field]: value, delaySeconds };
      });
    } else {
      setNewFollowUp((prev) => ({ ...prev, [field]: value }));
    }
    
    // Limpa erros para o campo atual
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Limpa erro geral de tempo se estiver modificando qualquer campo de tempo
    if ((field === "days" || field === "hours" || field === "minutes") && errors.time) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.time;
        return newErrors;
      });
    }
  };

  // Função para resetar o formulário
  const resetForm = () => {
    setNewFollowUp({
      name: "",
      description: "",
      days: 0,
      hours: 1,
      minutes: 0,
      delaySeconds: 3600, // 1 hora em segundos
    });
    setErrors({});
  };

  // Função para fechar o modal de criação
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    resetForm();
  };

  // Função para fechar o modal de edição
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingFollowUp(null);
    resetForm();
  };

  // Função para abrir o modal de edição com os dados do follow up
  const openEditModal = (index: number, followUp: FollowUp) => {
    setEditingFollowUp({ index, followUp });
    setNewFollowUp({
      name: followUp.name,
      description: followUp.description,
      days: followUp.days || 0,
      hours: followUp.hours || 0,
      minutes: followUp.minutes || 0,
      delaySeconds: followUp.delaySeconds
    });
    setIsEditModalOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col">
        <div className="mb-4">
          <h2 className="text-2xl font-bold">Follow Ups</h2>
          <p className="text-muted-foreground">
            Configure os follow ups para seu agente. Follow ups são mensagens que serão enviadas
            automaticamente após um determinado tempo.
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button variant="default" className="w-fit">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Follow Up
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Follow Up</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Nome</Label>
                <Input
                  id="create-name"
                  placeholder="Nome do follow up"
                  value={newFollowUp.name}
                  onChange={(e) => handleInputChange(e, "name")}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-description">Descrição</Label>
                <Textarea
                  id="create-description"
                  placeholder="Descrição do follow up"
                  value={newFollowUp.description}
                  onChange={(e) => handleInputChange(e, "description")}
                  rows={3}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Tempo de atraso</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="create-days" className="text-xs">Dias (máx. 14)</Label>
                    <Input
                      id="create-days"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max="14"
                      placeholder="Dias"
                      value={newFollowUp.days}
                      onChange={(e) => handleInputChange(e, "days")}
                    />
                    {errors.days && (
                      <p className="text-xs text-red-500">{errors.days}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="create-hours" className="text-xs">Horas</Label>
                    <Input
                      id="create-hours"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max="23"
                      placeholder="Horas"
                      value={newFollowUp.hours}
                      onChange={(e) => handleInputChange(e, "hours")}
                    />
                    {errors.hours && (
                      <p className="text-xs text-red-500">{errors.hours}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="create-minutes" className="text-xs">Minutos</Label>
                    <Input
                      id="create-minutes"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max="59"
                      placeholder="Minutos"
                      value={newFollowUp.minutes}
                      onChange={(e) => handleInputChange(e, "minutes")}
                    />
                    {errors.minutes && (
                      <p className="text-xs text-red-500">{errors.minutes}</p>
                    )}
                  </div>
                </div>
                {errors.time && (
                  <p className="text-sm text-red-500">{errors.time}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeCreateModal}>Cancelar</Button>
              <Button 
                onClick={() => {
                  handleAddFollowUp();
                  if (Object.keys(errors).length === 0) {
                    closeCreateModal();
                  }
                }}
              >
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Follow Up</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                placeholder="Nome do follow up"
                value={newFollowUp.name}
                onChange={(e) => handleInputChange(e, "name")}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                placeholder="Descrição do follow up"
                value={newFollowUp.description}
                onChange={(e) => handleInputChange(e, "description")}
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tempo de atraso</Label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-days" className="text-xs">Dias (máx. 14)</Label>
                  <Input
                    id="edit-days"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="14"
                    placeholder="Dias"
                    value={newFollowUp.days}
                    onChange={(e) => handleInputChange(e, "days")}
                  />
                  {errors.days && (
                    <p className="text-xs text-red-500">{errors.days}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="edit-hours" className="text-xs">Horas</Label>
                  <Input
                    id="edit-hours"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="23"
                    placeholder="Horas"
                    value={newFollowUp.hours}
                    onChange={(e) => handleInputChange(e, "hours")}
                  />
                  {errors.hours && (
                    <p className="text-xs text-red-500">{errors.hours}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="edit-minutes" className="text-xs">Minutos</Label>
                  <Input
                    id="edit-minutes"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="59"
                    placeholder="Minutos"
                    value={newFollowUp.minutes}
                    onChange={(e) => handleInputChange(e, "minutes")}
                  />
                  {errors.minutes && (
                    <p className="text-xs text-red-500">{errors.minutes}</p>
                  )}
                </div>
              </div>
              {errors.time && (
                <p className="text-sm text-red-500">{errors.time}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditModal}>Cancelar</Button>
            <Button 
              onClick={() => {
                handleAddFollowUp();
                if (Object.keys(errors).length === 0) {
                  closeEditModal();
                }
              }}
            >
              Atualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação para remoção */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar remoção</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Tem certeza que deseja remover este follow up?</p>
            {followUpToDelete !== null && formData.followUps[followUpToDelete] && (
              <div className="mt-2 p-3 bg-muted rounded-md">
                <p><strong>Nome:</strong> {formData.followUps[followUpToDelete].name}</p>
                <p><strong>Descrição:</strong> {formData.followUps[followUpToDelete].description}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteModal}>Cancelar</Button>
            <Button 
              variant="destructive" 
              onClick={handleRemoveFollowUp}
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {formData.followUps.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Follow Ups Configurados</h3>
          {formData.followUps.map((followUp, index) => (
            <Card key={index}>
              <CardContent className="p-4 flex justify-between items-start">
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Nome:</span> {followUp.name}
                  </div>
                  <div>
                    <span className="font-medium">Descrição:</span>{" "}
                    {followUp.description}
                  </div>
                  <div>
                    <span className="font-medium">Tempo de atraso:</span>{" "}
                    {followUp.days ? `${followUp.days} dias, ` : ""}
                    {followUp.hours ? `${followUp.hours} horas, ` : ""}
                    {followUp.minutes ? `${followUp.minutes} minutos` : ""}
                    {!followUp.days && !followUp.hours && !followUp.minutes ? "0 minutos" : ""}
                    {" "}<span className="text-xs text-muted-foreground"></span>
                  </div>
                </div>
                <div className="flex flex-col space-y-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditModal(index, followUp)}
                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-100"
                  >
                    <Edit className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openDeleteModal(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-100"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center p-6 border rounded-lg bg-muted/50">
          <p className="text-muted-foreground">
            Nenhum follow up configurado ainda. Clique no botão "Adicionar Follow Up" para começar.
          </p>
        </div>
      )}
    </div>
  );
};

export default FollowUps;
