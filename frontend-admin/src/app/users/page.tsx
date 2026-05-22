'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { usersService } from '@/services/admin.service';
import { Users as UsersIcon, Plus, Search, Edit, Trash2, Mail, AlertCircle, ToggleLeft, ToggleRight, RotateCcw } from 'lucide-react';
import Button from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { TableSkeleton } from '@/components/common/Skeleton';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import Pagination from '@/components/common/Pagination';

export default function UsersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const canDeleteUser = (targetUser: any) => {
    if (!currentUser) return false;

    const currentUserId = currentUser.id;
    const currentUserRole = currentUser.role?.name?.toUpperCase();

    const targetUserId = targetUser.id;
    const targetUserRole = targetUser.role?.name?.toUpperCase();

    // 1. Cannot delete yourself
    if (targetUserId === currentUserId) return false;

    // 2. Super Admin can delete anyone (except themselves, handled above)
    if (currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'SUPERADMIN' || currentUserRole?.includes('SUPER')) {
      return true;
    }

    // 3. Admin:
    if (currentUserRole === 'ADMIN') {
      // Admin cannot delete other Admins or Super Admins
      const isTargetAdmin = targetUserRole === 'ADMIN';
      const isTargetSuper = targetUserRole === 'SUPER_ADMIN' || targetUserRole === 'SUPERADMIN' || targetUserRole?.includes('SUPER');
      
      if (isTargetAdmin || isTargetSuper) {
        return false;
      }
      return true;
    }

    return false;
  };

  const canEditUser = (targetUser: any) => {
    if (!currentUser) return false;

    const currentUserId = currentUser.id;
    const currentUserRole = currentUser.role?.name?.toUpperCase();

    const targetUserId = targetUser.id;
    const targetUserRole = targetUser.role?.name?.toUpperCase();

    // 1. Can always edit yourself
    if (targetUserId === currentUserId) return true;

    // 2. Super Admin can edit anyone
    if (currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'SUPERADMIN' || currentUserRole?.includes('SUPER')) {
      return true;
    }

    // 3. Admin:
    if (currentUserRole === 'ADMIN') {
      // Admin cannot edit other Admins or Super Admins
      const isTargetAdmin = targetUserRole === 'ADMIN';
      const isTargetSuper = targetUserRole === 'SUPER_ADMIN' || targetUserRole === 'SUPERADMIN' || targetUserRole?.includes('SUPER');
      
      if (isTargetAdmin || isTargetSuper) {
        return false;
      }
      return true;
    }

    return false;
  };

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(''); // empty means 'All'

  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['admin-users', page, searchTerm, statusFilter],
    queryFn: () => usersService.findAll({ 
      page, 
      limit: 10, 
      search: searchTerm, 
      status: statusFilter === 'trash' ? 'DELETED' : statusFilter 
    }),
    retry: 1
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => 
      usersService.patch(`${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User status updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update status')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User moved to trash');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error deleting user')
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => usersService.patch(`${id}/restore`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User account restored successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to restore user')
  });

  const handleToggleStatus = (user: any) => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    
    Swal.fire({
      title: 'Change Status?',
      text: `Are you sure you want to mark ${user.firstName} as ${newStatus.toLowerCase()}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      confirmButtonText: `Yes, make ${newStatus.toLowerCase()}`
    }).then((result) => {
      if (result.isConfirmed) {
        statusMutation.mutate({ id: user.id, status: newStatus });
      }
    });
  };

  const handleDeleteUser = (user: any) => {
    Swal.fire({
      title: 'Move to Trash?',
      text: `User ${user.firstName} ${user.lastName} will be archived.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Yes, move to trash'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(user.id);
      }
    });
  };

  const handleRestoreUser = (user: any) => {
    Swal.fire({
      title: 'Restore User?',
      text: `Are you sure you want to restore ${user.firstName} ${user.lastName}? This will reactivate their account.`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      confirmButtonText: 'Yes, restore now'
    }).then((result) => {
      if (result.isConfirmed) {
        restoreMutation.mutate(user.id);
      }
    });
  };

  const getStatusBadge = (status: string) => {
     switch (status) {
        case 'ACTIVE': return 'badge-success';
        case 'INACTIVE': return 'badge-secondary';
        case 'SUSPENDED': return 'badge-danger';
        case 'DELETED': return 'badge-danger';
        default: return 'badge-secondary';
     }
  };

  const counts = usersData?.meta?.counts || { all: 0, active: 0, inactive: 0, trash: 0 };

  const tabs = [
    { label: 'All', value: '', count: counts.all },
    { label: 'Active', value: 'ACTIVE', count: counts.active },
    { label: 'Inactive', value: 'INACTIVE', count: counts.inactive },
    { label: 'Trash', value: 'trash', count: counts.trash },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white border border-slate-200 text-slate-400"><UsersIcon size={20} /></div>
             <div>
                <h1 className="text-xl font-bold text-slate-800 leading-tight">Accounts & Members</h1>
                <p className="text-xs text-slate-500 font-medium">Manage administrators, sellers, and customer accounts.</p>
             </div>
          </div>
          <Button 
            onClick={() => router.push('/users/add')}
            className="uppercase tracking-widest text-xs font-black py-2.5"
          >
            <Plus className="w-4 h-4 mr-2" /> Add New User
          </Button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-6 border-b border-slate-200 pb-px mb-2 overflow-x-auto no-scrollbar">
           {tabs.map((tab) => (
             <button
               key={tab.label}
               onClick={() => { setStatusFilter(tab.value); setPage(1); }}
               className={`pb-3 text-xs font-bold uppercase tracking-widest transition-all relative whitespace-nowrap ${
                 statusFilter === tab.value 
                   ? 'text-blue-600' 
                   : 'text-slate-400 hover:text-slate-600'
               }`}
             >
               {tab.label} <span className={`ml-1 font-black ${statusFilter === tab.value ? 'text-blue-400' : 'text-slate-300'}`}>({tab.count})</span>
               {statusFilter === tab.value && (
                 <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 animate-in fade-in slide-in-from-left-2" />
               )}
             </button>
           ))}
        </div>

        {error && (
           <div className="bg-red-50 border border-red-200 text-red-600 p-4 flex items-center gap-3 rounded-sm">
              <AlertCircle size={18} />
              <p className="text-xs font-bold uppercase tracking-wider">Failed to load users.</p>
           </div>
        )}

        <Card>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by name, email, or username..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="admin-input pl-9"
            />
          </div>
        </Card>

        <Card bodyClassName="p-0">
          <div className="admin-table-container">
            <table className="admin-table admin-table-striped admin-table-hover">
              <thead>
                <tr>
                  <th className="w-[60px]">Avatar</th>
                  <th>Full Name</th>
                  <th>Contact Information</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <TableSkeleton columns={6} rows={5} />
                ) : !usersData?.items || usersData.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                      No users found in this category.
                    </td>
                  </tr>
                ) : (
                  usersData?.items?.map((user: any) => (
                    <tr key={user.id}>
                      <td>
                        <div className="w-8 h-8 rounded-sm bg-slate-100 border border-slate-200 overflow-hidden">
                           <img 
                             src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName || 'U'}&background=f1f5f9&color=64748b&bold=true`} 
                             alt="" 
                             className="w-full h-full object-cover"
                           />
                        </div>
                      </td>
                      <td>
                        <p className="font-bold text-slate-800 leading-tight">{user.firstName} {user.lastName}</p>
                        <p className="text-[10px] text-blue-600 font-bold uppercase">@{user.username || 'user'}</p>
                      </td>
                      <td>
                        <div className="flex flex-col gap-0.5">
                           <p className="text-xs font-medium text-slate-600 flex items-center gap-1.5"><Mail size={10} /> {user.email}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Phone: {user.phone || 'N/A'}</p>
                        </div>
                      </td>
                      <td>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm border border-slate-200">
                           {user.role?.name || 'USER'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                           <span className={`badge ${getStatusBadge(user.status)}`}>
                              {user.status?.toLowerCase() || 'inactive'}
                           </span>
                           {user.status !== 'DELETED' && canDeleteUser(user) && (
                             <button 
                               onClick={() => handleToggleStatus(user)}
                               className={`transition-colors ${user.status === 'ACTIVE' ? 'text-green-600 hover:text-green-700' : 'text-slate-300 hover:text-slate-400'}`}
                             >
                                {user.status === 'ACTIVE' ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                             </button>
                           )}
                        </div>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1">
                          {user.status === 'DELETED' ? (
                            canDeleteUser(user) && (
                              <button 
                                onClick={() => handleRestoreUser(user)}
                                className="p-1.5 text-slate-400 hover:text-green-600" 
                                title="Restore User"
                              >
                                <RotateCcw size={14} />
                              </button>
                            )
                          ) : (
                            <>
                              {canEditUser(user) && (
                                <button 
                                  onClick={() => router.push(`/users/${user.id}/edit`)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600" 
                                  title="Edit User"
                                >
                                  <Edit size={14} />
                                </button>
                              )}
                              {canDeleteUser(user) && (
                                <button 
                                  onClick={() => handleDeleteUser(user)}
                                  className="p-1.5 text-slate-400 hover:text-red-600" 
                                  title="Delete User"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {!isLoading && usersData?.meta && (
            <Pagination 
              currentPage={page}
              totalPages={usersData.meta.totalPages}
              onPageChange={setPage}
              totalItems={usersData.meta.total}
              itemsPerPage={10}
            />
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
