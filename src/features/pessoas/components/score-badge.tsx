import { ScoreConfiabilidade } from "../types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

interface ScoreBadgeProps {
  score: ScoreConfiabilidade;
  totalPagosEmDia: number;
  totalAtrasados: number;
  totalEmprestimos: number;
}

export function ScoreBadge({ score, totalPagosEmDia, totalAtrasados, totalEmprestimos }: ScoreBadgeProps) {
  const getScoreInfo = () => {
    switch (score) {
      case "EXCELENTE":
        return { label: "EXCELENTE", color: "bg-green-500", text: "text-green-500", progress: 100 };
      case "BOM":
        return { label: "BOM", color: "bg-blue-500", text: "text-blue-500", progress: 80 };
      case "REGULAR":
        return { label: "REGULAR", color: "bg-yellow-500", text: "text-yellow-500", progress: 50 };
      case "RISCO_BAIXO":
        return { label: "RISCO BAIXO", color: "bg-orange-500", text: "text-orange-500", progress: 30 };
      case "RISCO_ALTO":
        return { label: "RISCO ALTO", color: "bg-red-500", text: "text-red-500", progress: 10 };
      default:
        return { label: "DESCONHECIDO", color: "bg-gray-500", text: "text-gray-500", progress: 0 };
    }
  };

  const info = getScoreInfo();
  
  // Calculate a precise percentage if they have loans, otherwise use the default category progress
  const percentage = totalEmprestimos > 0 
    ? Math.round((totalPagosEmDia / totalEmprestimos) * 100) 
    : info.progress;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col gap-1.5 w-full max-w-[120px] cursor-help">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold tracking-wider ${info.text}`}>
                {info.label}
              </span>
              <span className="text-[10px] text-muted-foreground">{percentage}%</span>
            </div>
            <Progress value={percentage} indicatorColor={info.color} className="h-1.5 bg-background/50" />
          </div>
        </TooltipTrigger>
        <TooltipContent className="glass-panel border-border/40 text-xs">
          <p className="font-semibold text-white mb-1">Histórico de Pagamentos</p>
          <p className="text-muted-foreground">Em dia: <span className="text-green-400 font-medium">{totalPagosEmDia}</span></p>
          <p className="text-muted-foreground">Atrasados: <span className="text-red-400 font-medium">{totalAtrasados}</span></p>
          <p className="text-muted-foreground">Total: {totalEmprestimos}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
