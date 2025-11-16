import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const useDataExport = () => {
  const { toast } = useToast();

  const exportToCSV = async (dataType: "all" | "tasks" | "notes" | "habits" | "projects" | "calendar") => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let csvContent = "";
      let filename = "";

      if (dataType === "all" || dataType === "tasks") {
        const { data: tasks } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", user.id);
        
        if (tasks && tasks.length > 0) {
          csvContent += "=== ЗАДАЧИ ===\n";
          csvContent += "Название,Описание,Приоритет,Срок,Завершено,Дата завершения\n";
          tasks.forEach(task => {
            csvContent += `"${task.title}","${task.description || ""}","${task.priority || ""}","${task.due_date || ""}","${task.completed ? "Да" : "Нет"}","${task.completed_at || ""}"\n`;
          });
          csvContent += "\n";
        }
      }

      if (dataType === "all" || dataType === "notes") {
        const { data: notes } = await supabase
          .from("notes")
          .select("*")
          .eq("user_id", user.id);
        
        if (notes && notes.length > 0) {
          csvContent += "=== ЗАМЕТКИ ===\n";
          csvContent += "Название,Содержание,Дата создания\n";
          notes.forEach(note => {
            csvContent += `"${note.title}","${note.content || ""}","${note.created_at}"\n`;
          });
          csvContent += "\n";
        }
      }

      if (dataType === "all" || dataType === "habits") {
        const { data: habits } = await supabase
          .from("habits")
          .select("*")
          .eq("user_id", user.id);
        
        if (habits && habits.length > 0) {
          csvContent += "=== ПРИВЫЧКИ ===\n";
          csvContent += "Название,Описание,Частота,Дата создания\n";
          habits.forEach(habit => {
            csvContent += `"${habit.name}","${habit.description || ""}","${habit.frequency || ""}","${habit.created_at}"\n`;
          });
          csvContent += "\n";
        }
      }

      if (dataType === "all" || dataType === "projects") {
        const { data: projects } = await supabase
          .from("projects")
          .select("*")
          .eq("user_id", user.id);
        
        if (projects && projects.length > 0) {
          csvContent += "=== ПРОЕКТЫ ===\n";
          csvContent += "Название,Описание,Статус,Дата создания\n";
          projects.forEach(project => {
            csvContent += `"${project.name}","${project.description || ""}","${project.status || ""}","${project.created_at}"\n`;
          });
          csvContent += "\n";
        }
      }

      if (dataType === "all" || dataType === "calendar") {
        const { data: events } = await supabase
          .from("calendar_events")
          .select("*")
          .eq("user_id", user.id);
        
        if (events && events.length > 0) {
          csvContent += "=== СОБЫТИЯ КАЛЕНДАРЯ ===\n";
          csvContent += "Название,Описание,Дата,Время,Тип\n";
          events.forEach(event => {
            csvContent += `"${event.title}","${event.description || ""}","${event.date}","${event.time || ""}","${event.type || ""}"\n`;
          });
          csvContent += "\n";
        }
      }

      filename = dataType === "all" ? "all_data.csv" : `${dataType}.csv`;

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Экспорт завершен",
        description: "Данные успешно экспортированы в CSV",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Ошибка экспорта",
        description: "Не удалось экспортировать данные",
        variant: "destructive",
      });
    }
  };

  const exportToPDF = async (includeStats: boolean = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const doc = new jsPDF();
      let yPosition = 20;

      doc.setFontSize(20);
      doc.text("ProductiveMe - Отчет", 14, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.text(`Дата: ${new Date().toLocaleDateString("ru-RU")}`, 14, yPosition);
      yPosition += 15;

      if (includeStats) {
        doc.setFontSize(16);
        doc.text("Статистика", 14, yPosition);
        yPosition += 10;

        const [tasks, completedTasks, notes, habits, events, projects] = await Promise.all([
          supabase.from("tasks").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("tasks").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("completed", true),
          supabase.from("notes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("habits").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("calendar_events").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("projects").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        ]);

        const statsData = [
          ["Всего задач", tasks.count || 0],
          ["Выполнено задач", completedTasks.count || 0],
          ["Заметок создано", notes.count || 0],
          ["Привычек отслеживается", habits.count || 0],
          ["Активных проектов", projects.count || 0],
          ["Событий в календаре", events.count || 0],
        ];

        autoTable(doc, {
          startY: yPosition,
          head: [["Метрика", "Значение"]],
          body: statsData,
          theme: "grid",
        });

        yPosition = (doc as any).lastAutoTable.finalY + 15;
      }

      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .limit(50);

      if (tasks && tasks.length > 0) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(16);
        doc.text("Задачи", 14, yPosition);
        yPosition += 10;

        const taskData = tasks.map(task => [
          task.title,
          task.priority || "-",
          task.due_date || "-",
          task.completed ? "Да" : "Нет",
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [["Название", "Приоритет", "Срок", "Завершено"]],
          body: taskData,
          theme: "grid",
        });

        yPosition = (doc as any).lastAutoTable.finalY + 15;
      }

      const { data: notes } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .limit(50);

      if (notes && notes.length > 0) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(16);
        doc.text("Заметки", 14, yPosition);
        yPosition += 10;

        const noteData = notes.map(note => [
          note.title,
          new Date(note.created_at).toLocaleDateString("ru-RU"),
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [["Название", "Дата создания"]],
          body: noteData,
          theme: "grid",
        });
      }

      doc.save("productiveme_report.pdf");

      toast({
        title: "Экспорт завершен",
        description: "PDF отчет успешно создан",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Ошибка экспорта",
        description: "Не удалось создать PDF отчет",
        variant: "destructive",
      });
    }
  };

  return {
    exportToCSV,
    exportToPDF,
  };
};
