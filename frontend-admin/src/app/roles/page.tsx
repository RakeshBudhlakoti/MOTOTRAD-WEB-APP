'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { rolesService } from '@/services/admin.service';
import { ShieldCheck, Plus, Search, Edit, Trash2, Shield, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import Button from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import { TableSkeleton } from '@/components/common/Skeleton';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/common/ConfirmDialog';

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [roleToDelete, setRoleToDelete] = useState<any>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => rolesService.findAll()
  });

  const { data: permissions, isLoading: permissionsLoading, error: permsError } = useQuery({
    queryKey: ['admin-permissions'],
    queryFn: () => rolesService.getPermissions()
  });

  const mutation = useMutation({
    mutationFn: (data: any) => editingRole ? rolesService.update(editingRole.id, data) : rolesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      toast.success(`Role ${editingRole ? 'updated' : 'created'} successfully`);
      handleClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Something went wrong')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rolesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      toast.success('Role deleted successfully');
      setRoleToDelete(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error deleting role')
  });

  const handleEdit = (role: any) => {
    setEditingRole(role);
    // Correctly map permission IDs from the role's permissions relation
    setSelectedPermissionIds(role.permissions?.map((rp: any) => rp.permission?.id).filter(Boolean) || []);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingRole(null);
    setSelectedPermissionIds([]);
  };

  const togglePermission = (permId: string) => {
    setSelectedPermissionIds(prev => 
      prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
    );
  };

  const handleSave = () => {
    const roleName = (document.getElementById('role-name') as HTMLInputElement)?.value;
    if (!roleName) return toast.error('Role name is required');
    
    mutation.mutate({ 
      name: roleName.toUpperCase().replace(/\s+/g, '_'), 
      permissions: selectedPermissionIds 
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white border border-slate-200 text-slate-400"><Shield size={20} /></div>
             <div>
                <h1 className="text-xl font-bold text-slate-800 leading-tight">Access Control</h1>
                <p className="text-xs text-slate-500 font-medium">Define security roles and manage granular system permissions.</p>
             </div>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="uppercase tracking-widest text-xs font-black py-2.5">
            <Plus className="w-4 h-4 mr-2" /> Define New Role
          </Button>
        </div>

        {permsError && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 flex items-center gap-3 rounded-sm">
            <AlertCircle size={18} />
            <p className="text-xs font-bold uppercase tracking-wider">Failed to load permissions matrix. Security configuration might be restricted.</p>
          </div>
        )}

        <Card bodyClassName="p-0">
          <div className="admin-table-container">
            <table className="admin-table admin-table-striped admin-table-hover">
              <thead>
                <tr>
                  <th>Role Name</th>
                  <th>Permission Count</th>
                  <th>Created Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rolesLoading ? (
                  <TableSkeleton columns={4} rows={5} />
                ) : !roles?.items || roles.items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                      No roles defined in matrix.
                    </td>
                  </tr>
                ) : (
                  roles?.items?.map((role: any) => (
                    <tr key={role.id}>
                      <td>
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-sm bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                               <ShieldCheck size={16} />
                            </div>
                            <p className="font-bold text-slate-800 uppercase tracking-widest text-xs">{role.name}</p>
                         </div>
                      </td>
                      <td>
                         <span className="text-xs font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-sm">
                            {role.permissions?.length || 0} Permissions
                         </span>
                      </td>
                      <td>
                         <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(role.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1">
                          {!role.isSystem && (
                            <>
                              <button onClick={() => handleEdit(role)} className="p-1.5 text-slate-400 hover:text-blue-600"><Edit size={14} /></button>
                              <button onClick={() => setRoleToDelete(role)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                            </>
                          )}
                          {role.isSystem && <span className="text-[9px] font-black uppercase text-slate-300 pr-2">System Protected</span>}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingRole ? 'Update Role' : 'Create New Role'}
        maxWidth="max-w-2xl"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} isLoading={mutation.isPending}>
              {editingRole ? 'Update Configuration' : 'Save New Role'}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
           <Input 
             id="role-name" 
             label="Role Identifier" 
             defaultValue={editingRole?.name} 
             placeholder="e.g. PRODUCT_MANAGER" 
             helpText="Use uppercase with underscores. System will auto-format." 
           />
           
           <div className="space-y-4">
              <p className="admin-label">Assign Permissions Matrix</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                 {permissionsLoading ? <div className="text-xs font-bold text-slate-400">Loading matrix...</div> : 
                   permissions?.map((perm: any) => (
                    <label 
                      key={perm.id} 
                      className={`flex items-center justify-between p-3 border rounded-sm cursor-pointer transition-all ${selectedPermissionIds.includes(perm.id) ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                    >
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                             {perm.action.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                             Resource: {perm.resource}
                          </span>
                       </div>
                       <input 
                         type="checkbox" 
                         className="w-4 h-4 rounded-sm accent-blue-600"
                         checked={selectedPermissionIds.includes(perm.id)}
                         onChange={() => togglePermission(perm.id)}
                       />
                    </label>
                 ))}
              </div>
           </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!roleToDelete}
        onClose={() => setRoleToDelete(null)}
        onConfirm={() => deleteMutation.mutate(roleToDelete.id)}
        title="Revoke Role Definition"
        message={`Warning: You are about to permanently delete the "${roleToDelete?.name}" role. This may block access for users currently assigned to this role.`}
        confirmText="Confirm Deletion"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </DashboardLayout>
  );
}
