'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api, ApiResponse } from '@/lib/api';
import {
  ApplicationStatus,
  Branch,
  Gender,
  IApplication,
  PaginatedResponse,
  PharmacyExperience,
  Position,
} from '@avitus/shared-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { statusColors, normalizeApplicationStatus } from '@/lib/status';
import { Search, Eye } from 'lucide-react';

interface ApplicationsListProps {
  title: string;
  description?: string;
  fixedStatus?: ApplicationStatus;
  showAll?: boolean;
  hideStatusFilter?: boolean;
}

export function ApplicationsList({
  title,
  description,
  fixedStatus,
  showAll = false,
  hideStatusFilter = Boolean(fixedStatus),
}: ApplicationsListProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [position, setPosition] = useState('');
  const [branch, setBranch] = useState('');
  const [gender, setGender] = useState('');
  const [experience, setExperience] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: [
      'applications',
      fixedStatus,
      showAll,
      page,
      search,
      position,
      branch,
      gender,
      experience,
      statusFilter,
      dateFrom,
      dateTo,
    ],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (fixedStatus) params.status = fixedStatus;
      if (showAll && statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      if (position) params.position = position;
      if (branch) params.branch = branch;
      if (gender) params.gender = gender;
      if (experience) params.pharmacyExperience = experience;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const { data } = await api.get<ApiResponse<PaginatedResponse<IApplication>>>('/applications', {
        params,
      });
      return data.data;
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const resetFilters = () => {
    setSearch('');
    setSearchInput('');
    setPosition('');
    setBranch('');
    setGender('');
    setExperience('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{title}</h1>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>

      <div className="mb-6 space-y-4 rounded-lg border bg-card p-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Ism yoki telefon bo'yicha qidirish..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Button type="submit">Qidirish</Button>
          <Button type="button" variant="outline" onClick={resetFilters}>
            Tozalash
          </Button>
        </form>

        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          {showAll && (
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Holat</option>
              {Object.values(ApplicationStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}

          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={position}
            onChange={(e) => {
              setPosition(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Lavozim</option>
            {Object.values(Position).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={branch}
            onChange={(e) => {
              setBranch(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Filial</option>
            {Object.values(Branch).map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={gender}
            onChange={(e) => {
              setGender(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Jins</option>
            {Object.values(Gender).map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={experience}
            onChange={(e) => {
              setExperience(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tajriba</option>
            {Object.values(PharmacyExperience).map((exp) => (
              <option key={exp} value={exp}>
                {exp}
              </option>
            ))}
          </select>

          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {!hideStatusFilter && fixedStatus && (
          <p className="text-sm text-muted-foreground">
            Status: <span className="font-medium text-foreground">{fixedStatus}</span>
          </p>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Yuklanmoqda...</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">F.I.Sh</th>
                  <th className="px-4 py-3 text-left font-medium">Telefon</th>
                  <th className="px-4 py-3 text-left font-medium">Lavozim</th>
                  <th className="px-4 py-3 text-left font-medium">Filial</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Sana</th>
                  <th className="px-4 py-3 text-left font-medium">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((app) => {
                  const appStatus = normalizeApplicationStatus(app.status);
                  return (
                    <tr key={app._id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3">{app.answers.fullName ?? '-'}</td>
                      <td className="px-4 py-3">{app.answers.phone ?? '-'}</td>
                      <td className="px-4 py-3">
                        {app.answers.position === Position.OTHER
                          ? app.answers.otherPosition
                          : (app.answers.position ?? '-')}
                      </td>
                      <td className="px-4 py-3">{app.answers.branch ?? '-'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusColors[appStatus]}>{appStatus}</Badge>
                      </td>
                      <td className="px-4 py-3">{formatDate(app.submittedAt)}</td>
                      <td className="px-4 py-3">
                        <Link href={`/applications/view/?id=${app._id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {data?.data.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      Arizalar topilmadi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {data && data.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Jami: {data.total} ta | Sahifa {data.page}/{data.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Oldingi
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Keyingi
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
