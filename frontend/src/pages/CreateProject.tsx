import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { groupService } from '../services/groupService';
import { userService } from '../services/userService';
import { useAuthStore } from '../store/authStore';
import type { ProjectGroup, User } from '../types';

export const CreateProject = () => {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [existingGroups, setExistingGroups] = useState<ProjectGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ProjectGroup | null>(null);
  const [guides, setGuides] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  
  const [formData, setFormData] = useState({
    createNewGroup: true,
    groupName: '',
    title: '',
    description: '',
    assignedGuide: '',
    members: [] as number[],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchGuides();
    fetchStudents();
  }, []);

  const fetchGuides = async () => {
    try {
      const { users } = await userService.getUsersByRole('Guide');
      setGuides(users);
    } catch (error) {
      console.error('Failed to fetch guides:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const { users } = await userService.getAllUsers();
      setStudents(users.filter(u => u.role === 'Student' && u.userId !== user?.userId));
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const handleSearchGroups = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const { groups } = await groupService.searchGroups(searchQuery);
      setExistingGroups(groups);
    } catch (error) {
      console.error('Failed to search groups:', error);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      let groupId: number;

      if (formData.createNewGroup) {
        // Create new group
        if (!formData.groupName) {
          setError('Group name is required');
          setLoading(false);
          return;
        }

        const groupResponse = await groupService.createGroup({
          groupName: formData.groupName,
          leaderId: user!.userId,
          members: formData.members.map(userId => ({ userId })),
        });
        groupId = groupResponse.group.groupId;
      } else {
        // Use existing group
        if (!selectedGroup) {
          setError('Please select a group');
          setLoading(false);
          return;
        }
        groupId = selectedGroup.groupId;
      }

      // Create project
      await projectService.createProject({
        groupId,
        title: formData.title,
        description: formData.description,
        assignedGuide: formData.assignedGuide ? parseInt(formData.assignedGuide) : undefined,
      });

      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Create New Project</h1>

      <div className="card">
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 style={styles.stepTitle}>Step 1: Group Setup</h2>
            
            <div style={styles.radioGroup}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  checked={formData.createNewGroup}
                  onChange={() =>
                    setFormData({ ...formData, createNewGroup: true })
                  }
                />
                <span>Create New Group</span>
              </label>

              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  checked={!formData.createNewGroup}
                  onChange={() =>
                    setFormData({ ...formData, createNewGroup: false })
                  }
                />
                <span>Join Existing Group</span>
              </label>
            </div>

            {formData.createNewGroup ? (
              <>
                <div className="input-group">
                  <label>Group Name</label>
                  <input
                    type="text"
                    value={formData.groupName}
                    onChange={(e) =>
                      setFormData({ ...formData, groupName: e.target.value })
                    }
                    placeholder="e.g., Team Alpha"
                  />
                </div>

                <div className="input-group">
                  <label>Add Group Members (Optional)</label>
                  <select
                    multiple
                    value={formData.members.map(String)}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                      setFormData({ ...formData, members: selected });
                    }}
                    style={{ minHeight: '120px' }}
                  >
                    {students.map((student) => (
                      <option key={student.userId} value={student.userId}>
                        {student.name} ({student.email})
                      </option>
                    ))}
                  </select>
                  <small style={{ color: '#6b7280' }}>
                    Hold Ctrl/Cmd to select multiple members
                  </small>
                </div>
              </>
            ) : (
              <>
                <div className="input-group">
                  <label>Search for Group</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Enter group name..."
                    />
                    <button
                      onClick={handleSearchGroups}
                      className="btn btn-primary"
                    >
                      Search
                    </button>
                  </div>
                </div>

                {existingGroups.length > 0 && (
                  <div style={styles.groupList}>
                    {existingGroups.map((group) => (
                      <div
                        key={group.groupId}
                        style={{
                          ...styles.groupItem,
                          borderColor: selectedGroup?.groupId === group.groupId ? '#4f46e5' : '#e5e7eb',
                        }}
                        onClick={() => setSelectedGroup(group)}
                      >
                        <div>
                          <strong>{group.groupName}</strong>
                          <div style={{ fontSize: '13px', color: '#6b7280' }}>
                            Leader: {group.leader?.name}
                          </div>
                        </div>
                        {selectedGroup?.groupId === group.groupId && (
                          <span style={{ color: '#4f46e5', fontWeight: '600' }}>
                            ✓ Selected
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            <button
              onClick={() => setStep(2)}
              className="btn btn-primary"
              style={{ marginTop: '16px' }}
            >
              Next: Project Details
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={styles.stepTitle}>Step 2: Project Details</h2>

            <div className="input-group">
              <label>Project Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g., AI-Powered Healthcare System"
              />
            </div>

            <div className="input-group">
              <label>Project Description</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe your project..."
              />
            </div>

            <div className="input-group">
              <label>Assign Guide (Optional)</label>
              <select
                value={formData.assignedGuide}
                onChange={(e) =>
                  setFormData({ ...formData, assignedGuide: e.target.value })
                }
              >
                <option value="">-- Select a Guide --</option>
                {guides.map((guide) => (
                  <option key={guide.userId} value={guide.userId}>
                    {guide.name} ({guide.email})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                onClick={() => setStep(1)}
                className="btn btn-outline"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                className="btn btn-primary"
                disabled={loading || !formData.title}
              >
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  stepTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '20px',
  },
  radioGroup: {
    display: 'flex',
    gap: '24px',
    marginBottom: '24px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  groupList: {
    marginTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  groupItem: {
    padding: '12px',
    border: '2px solid',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
};

