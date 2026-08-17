import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, SearchX } from "lucide-react";
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
import { companiesQuery, INDUSTRIES } from "@/lib/directory";

export const Route = createFileRoute("/_authenticated/companies/")({
  head: () => ({
    meta: [
      { title: "Companies — CareerCollab" },
      {
        name: "description",
        content:
          "Browse companies posting real student projects. Filter by industry, location and hiring status.",
      },
      { property: "og:title", content: "Companies — CareerCollab" },
      { property: "og:description", content: "Find companies hiring student collaborators." },
    ],
  }),
  component: CompaniesPage,
});

function CompaniesPage() {
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("all");
  const [location, setLocation] = useState("");
  const [hiring, setHiring] = useState("all");

  const companies = useQuery(companiesQuery({ search, industry, location, hiring }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        description="The organisations publishing projects on CareerCollab."
      />

      <div className="filter-bar grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search companies…"
          maxLength={80}
          aria-label="Search companies"
        />
        <Select value={industry} onValueChange={setIndustry}>
          <SelectTrigger aria-label="Filter by industry">
            <SelectValue placeholder="Industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All industries</SelectItem>
            {INDUSTRIES.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location"
          maxLength={80}
          aria-label="Filter by location"
        />
        <Select value={hiring} onValueChange={setHiring}>
          <SelectTrigger aria-label="Filter by hiring status">
            <SelectValue placeholder="Hiring status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any status</SelectItem>
            <SelectItem value="yes">Actively hiring</SelectItem>
            <SelectItem value="no">Not hiring</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {companies.isPending ? (
        <ListSkeleton rows={4} />
      ) : companies.isError ? (
        <ErrorState message={(companies.error as Error).message} onRetry={companies.refetch} />
      ) : companies.data.length === 0 ? (
        <EmptyState
          icon={<SearchX className="size-5" />}
          title="No companies match those filters"
          description="Try a broader search or clear a filter."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {companies.data.map((company) => (
            <li key={company.id}>
              <Link
                to="/companies/$companyId"
                params={{ companyId: company.id }}
                className="panel card-interactive flex h-full items-start gap-3 p-4"
              >
                <Avatar className="size-10 shrink-0 rounded-lg">
                  <AvatarImage src={company.logo_url ?? undefined} alt="" />
                  <AvatarFallback className="rounded-lg">
                    <Building2 className="size-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate text-sm font-medium">
                    {company.name}
                    {company.verified ? (
                      <span className="rounded-full border border-success/30 bg-success/12 px-1.5 py-0.5 text-[10px] text-success">
                        Verified
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[company.industry, company.location].filter(Boolean).join(" · ") ||
                      "Company"}
                  </p>
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                    {company.description || "No description yet."}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
