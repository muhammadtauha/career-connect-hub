import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SearchX } from "lucide-react";
import { useState } from "react";

import { EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AVAILABILITY, AVAILABILITY_LABELS, studentsQuery } from "@/lib/directory";

export const Route = createFileRoute("/_authenticated/students/")({
  head: () => ({
    meta: [
      { title: "Student directory — CareerCollab" },
      {
        name: "description",
        content:
          "Search verified university students by skill, university, department, location and availability.",
      },
      { property: "og:title", content: "Student directory — CareerCollab" },
      { property: "og:description", content: "Find student collaborators for your next project." },
    ],
  }),
  component: StudentsPage,
});

function StudentsPage() {
  const [search, setSearch] = useState("");
  const [skill, setSkill] = useState("");
  const [university, setUniversity] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [availability, setAvailability] = useState("all");

  const students = useQuery(
    studentsQuery({ search, skill, university, department, location, availability }),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student directory"
        description="Filter by skills, university, department, location and availability."
      />

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or headline…"
          maxLength={80}
          aria-label="Search students"
        />
        <Input
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          placeholder="Skill (e.g. Python)"
          maxLength={40}
          aria-label="Filter by skill"
        />
        <Input
          value={university}
          onChange={(e) => setUniversity(e.target.value)}
          placeholder="University"
          maxLength={80}
          aria-label="Filter by university"
        />
        <Input
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          placeholder="Department"
          maxLength={80}
          aria-label="Filter by department"
        />
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location"
          maxLength={80}
          aria-label="Filter by location"
        />
        <Select value={availability} onValueChange={setAvailability}>
          <SelectTrigger aria-label="Filter by availability">
            <SelectValue placeholder="Availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any availability</SelectItem>
            {AVAILABILITY.map((item) => (
              <SelectItem key={item} value={item}>
                {AVAILABILITY_LABELS[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {students.isPending ? (
        <ListSkeleton rows={4} />
      ) : students.isError ? (
        <ErrorState message={(students.error as Error).message} onRetry={students.refetch} />
      ) : students.data.length === 0 ? (
        <EmptyState
          icon={<SearchX className="size-5" />}
          title="No students match those filters"
          description="Try a broader search or clear a filter."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {students.data.map((student) => (
            <li key={student.id}>
              <Link
                to="/students/$studentId"
                params={{ studentId: student.id }}
                className="panel flex h-full items-start gap-3 p-4 transition-colors hover:border-primary/40"
              >
                <Avatar className="size-10 shrink-0">
                  <AvatarImage src={student.avatar_url ?? undefined} alt="" />
                  <AvatarFallback className="text-xs">
                    {(student.full_name || "?").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {student.full_name || "Unnamed student"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {student.headline || student.university || "Student"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(student.skills ?? []).slice(0, 4).map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-border bg-elevated px-2 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
