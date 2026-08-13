import { useState, useEffect } from 'react';
import { adminApi } from '../utils/api';
import ToastNotification from './ToastNotification';

export default function AdminModal({ onClose }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('USERS'); // 'USERS' or 'REPORTS'
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, usersRes, reportsRes] = await Promise.all([
        adminApi.stats(),
        adminApi.getUsers(),
        adminApi.getReports(),
      ]);
      setStats(statsRes.data.data.stats);
      setUsers(usersRes.data.data.users || []);
      setReports(reportsRes.data.data.reports || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Không thể tải dữ liệu quản trị');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (reportId, status = 'RESOLVED') => {
    try {
      const res = await adminApi.updateReportStatus(reportId, status);
      const updated = res.data.data.report;
      setReports(prev => prev.map(r => r.id === updated.id ? updated : r));
      setToast({ type: 'success', message: 'Đã cập nhật trạng thái báo cáo thành công' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error?.message || 'Không thể cập nhật trạng thái báo cáo' });
    }
  };

  const handleToggleBan = async (userToToggle) => {
    const confirmText = userToToggle.status === 'BANNED'
      ? `Bạn có chắc muốn MỞ KHÓA tài khoản ${userToToggle.email}?`
      : `Bạn có chắc muốn KHÓA (BAN) tài khoản ${userToToggle.email}?`;

    if (!window.confirm(confirmText)) return;

    setActionLoading(userToToggle.userId);
    try {
      const res = await adminApi.toggleBan(userToToggle.userId);
      const updated = res.data.data.user;
      setUsers(prev => prev.map(u => u.userId === updated.userId ? { ...u, status: updated.status } : u));
      // Refresh stats
      const statsRes = await adminApi.stats();
      setStats(statsRes.data.data.stats);
      if (selectedUser?.userId === updated.userId) {
        setSelectedUser(prev => prev ? { ...prev, status: updated.status } : null);
      }
      setToast({ type: 'success', message: `Đã ${updated.status === 'BANNED' ? 'khóa' : 'mở khóa'} tài khoản ${userToToggle.email}` });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error?.message || 'Thao tác thất bại' });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    return (
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('vi-VN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={styles.backdrop}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#1f2937' }}>Bảng quản trị hệ thống</h2>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={styles.alert}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            Đang tải dữ liệu hệ thống...
          </div>
        ) : (
          <div style={styles.content}>
            {/* Stats Cards */}
            {stats && (
              <div style={styles.statsGrid}>
                <div style={{ ...styles.statCard, borderLeft: '4px solid #3b82f6' }}>
                  <div style={styles.statNumber}>{stats.totalUsers}</div>
                  <div style={styles.statLabel}>Tổng tài khoản</div>
                </div>
                <div style={{ ...styles.statCard, borderLeft: '4px solid #10b981' }}>
                  <div style={{ ...styles.statNumber, color: '#10b981' }}>{stats.activeUsers}</div>
                  <div style={styles.statLabel}>Đang hoạt động</div>
                </div>
                <div style={{ ...styles.statCard, borderLeft: '4px solid #ef4444' }}>
                  <div style={{ ...styles.statNumber, color: '#ef4444' }}>{stats.bannedUsers}</div>
                  <div style={styles.statLabel}>Tài khoản đã bị khóa</div>
                </div>
                <div style={{ ...styles.statCard, borderLeft: '4px solid #ec4899' }}>
                  <div style={{ ...styles.statNumber, color: '#ec4899' }}>{stats.totalMatches}</div>
                  <div style={styles.statLabel}>Lượt ghép đôi thành công</div>
                </div>
              </div>
            )}

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.2rem' }}>
              <button
                onClick={() => setActiveTab('USERS')}
                style={{
                  padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.88rem',
                  cursor: 'pointer', border: 'none', transition: 'all 0.2s ease',
                  background: activeTab === 'USERS' ? '#3b82f6' : '#e5e7eb',
                  color: activeTab === 'USERS' ? '#fff' : '#374151',
                }}
              >
                Quản lý tài khoản ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('REPORTS')}
                style={{
                  padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.88rem',
                  cursor: 'pointer', border: 'none', transition: 'all 0.2s ease',
                  background: activeTab === 'REPORTS' ? '#f59e0b' : '#e5e7eb',
                  color: activeTab === 'REPORTS' ? '#fff' : '#374151',
                }}
              >
                Báo cáo từ người dùng ({reports.filter(r => r.status === 'PENDING').length > 0 ? `${reports.filter(r => r.status === 'PENDING').length} mới` : reports.length})
              </button>
            </div>

            {activeTab === 'USERS' && (
              <>
                {/* Search & Filter */}
                <div style={styles.searchBar}>
                  <input
                    type="text"
                    placeholder="🔍 Tìm kiếm theo Tên, Username hoặc Email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={styles.searchInput}
                  />
                  <span style={{ fontSize: '0.88rem', color: '#6b7280' }}>
                    Hiển thị {filteredUsers.length} / {users.length} tài khoản
                  </span>
                </div>

                {/* Users Table */}
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>ID</th>
                        <th style={styles.th}>Người dùng</th>
                        <th style={styles.th}>Email</th>
                        <th style={styles.th}>Thời gian tạo</th>
                        <th style={styles.th}>Vai trò</th>
                        <th style={styles.th}>Trạng thái</th>
                        <th style={styles.th}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#9ca3af' }}>
                            Không tìm thấy tài khoản phù hợp
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map(u => (
                          <tr key={u.userId} style={styles.tr}>
                            <td style={styles.td}>#{u.userId}</td>
                            <td style={styles.td}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img
                                  src={u.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                                  alt=""
                                  style={styles.avatar}
                                />
                                <div>
                                  <div style={{ fontWeight: '600', color: '#111827' }}>{u.fullName || u.username}</div>
                                  <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>@{u.username}</div>
                                </div>
                              </div>
                            </td>
                            <td style={styles.td}>{u.email}</td>
                            <td style={styles.td}>{formatDate(u.createdAt)}</td>
                            <td style={styles.td}>
                              <span style={{
                                padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600',
                                backgroundColor: u.role === 'ADMIN' ? '#fef3c7' : '#f3f4f6',
                                color: u.role === 'ADMIN' ? '#b45309' : '#4b5563'
                              }}>
                                {u.role}
                              </span>
                            </td>
                            <td style={styles.td}>
                              <span style={{
                                padding: '5px 12px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: '600',
                                whiteSpace: 'nowrap', display: 'inline-block',
                                backgroundColor: u.status === 'BANNED' ? '#fee2e2' : '#d1fae5',
                                color: u.status === 'BANNED' ? '#991b1b' : '#065f46'
                              }}>
                                {u.status === 'BANNED' ? 'Đã bị khóa' : 'Đang hoạt động'}
                              </span>
                            </td>
                            <td style={styles.td}>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  style={styles.viewBtn}
                                  onClick={() => setSelectedUser(u)}
                                  title="Xem hồ sơ chi tiết"
                                >
                                  Hồ sơ
                                </button>
                                {u.role !== 'ADMIN' && (
                                  <button
                                    style={{
                                      ...styles.banBtn,
                                      backgroundColor: u.status === 'BANNED' ? '#10b981' : '#ef4444',
                                    }}
                                    disabled={actionLoading === u.userId}
                                    onClick={() => handleToggleBan(u)}
                                  >
                                    {actionLoading === u.userId ? '...' : u.status === 'BANNED' ? 'Unban' : 'Ban'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Reports Section */}
            {activeTab === 'REPORTS' && (
              <div style={styles.tableWrapper}>
                {reports.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    Hiện chưa có sự kiện báo cáo vi phạm nào từ người dùng.
                  </div>
                ) : (
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>ID</th>
                        <th style={styles.th}>Thời gian</th>
                        <th style={styles.th}>Tài khoản báo cáo</th>
                        <th style={styles.th}>Nội dung báo cáo</th>
                        <th style={styles.th}>Tài khoản bị báo cáo</th>
                        <th style={styles.th}>Trạng thái</th>
                        <th style={styles.th}>Thao tác Admin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map(rep => {
                        const reporter = rep.reporter || {};
                        const reported = rep.reported || {};
                        const isReportedBanned = reported.status === 'BANNED';
                        return (
                          <tr key={rep.id} style={styles.tr}>
                            <td style={styles.td}>#{rep.id}</td>
                            <td style={{ ...styles.td, fontSize: '0.8rem', color: '#6b7280' }}>
                              {formatDate(rep.createdAt)}
                            </td>
                            <td style={styles.td}>
                              <div
                                onClick={() => reporter.userId && setSelectedUser(reporter)}
                                title="Click để xem chi tiết tài khoản báo cáo"
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                              >
                                <img
                                  src={reporter.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                                  alt=""
                                  style={{ ...styles.avatar, border: '2px solid #3b82f6' }}
                                />
                                <div>
                                  <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.85rem', textDecoration: 'underline' }}>{reporter.fullName || reporter.username || 'N/A'}</div>
                                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{reporter.email}</div>
                                </div>
                              </div>
                            </td>
                            <td style={styles.td}>
                              <span style={{
                                background: '#fef3c7', color: '#b45309', padding: '4px 8px',
                                borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, display: 'inline-block'
                              }}>
                                {rep.reason}
                              </span>
                            </td>
                            <td style={styles.td}>
                              <div
                                onClick={() => reported.userId && setSelectedUser(reported)}
                                title="Click để xem chi tiết tài khoản bị báo cáo"
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                              >
                                <img
                                  src={reported.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                                  alt=""
                                  style={{ ...styles.avatar, border: '2px solid #ef4444' }}
                                />
                                <div>
                                  <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.85rem', textDecoration: 'underline' }}>{reported.fullName || reported.username || 'N/A'}</div>
                                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{reported.email}</div>
                                </div>
                              </div>
                            </td>
                            <td style={styles.td}>
                              <span style={{
                                padding: '5px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '600',
                                whiteSpace: 'nowrap', display: 'inline-block',
                                backgroundColor: rep.status === 'RESOLVED' ? '#d1fae5' : '#fef3c7',
                                color: rep.status === 'RESOLVED' ? '#065f46' : '#b45309'
                              }}>
                                {rep.status === 'RESOLVED' ? 'Đã xử lý' : 'Chờ xử lý'}
                              </span>
                            </td>
                            <td style={styles.td}>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                {reported.userId && (
                                  <button
                                    style={{
                                      ...styles.banBtn,
                                      backgroundColor: isReportedBanned ? '#10b981' : '#ef4444',
                                      padding: '5px 10px', fontSize: '0.8rem', whiteSpace: 'nowrap'
                                    }}
                                    disabled={actionLoading === reported.userId}
                                    onClick={() => handleToggleBan(reported)}
                                  >
                                    {isReportedBanned ? 'Unban' : 'Ban'}
                                  </button>
                                )}
                                {rep.status === 'PENDING' && (
                                  <button
                                    onClick={() => handleResolveReport(rep.id, 'RESOLVED')}
                                    style={{
                                      background: '#10b981', color: '#fff', border: 'none',
                                      borderRadius: '6px', padding: '5px 10px', fontSize: '0.8rem',
                                      fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
                                    }}
                                  >
                                    Xử lý
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}

        {/* Profile Detail Modal */}
        {selectedUser && (
          <div style={styles.nestedBackdrop} onClick={() => setSelectedUser(null)}>
            <div style={styles.nestedModal} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, color: '#111827' }}>Chi tiết hồ sơ tài khoản #{selectedUser.userId}</h3>
                <button style={styles.closeBtn} onClick={() => setSelectedUser(null)}>✕</button>
              </div>

              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <img
                  src={selectedUser.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
                  alt=""
                  style={{ width: '120px', height: '120px', borderRadius: '16px', objectFit: 'cover', border: '3px solid #e5e7eb' }}
                />
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: '1.3rem' }}>{selectedUser.fullName || selectedUser.username}</h2>
                  <div style={{ color: '#4b5563', marginBottom: '8px' }}>@{selectedUser.username} • {selectedUser.email}</div>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem' }}>
                    <span>{selectedUser.location || 'Chưa có vị trí'}</span>
                    <span>{selectedUser.height ? `${selectedUser.height} cm` : 'Chưa có chiều cao'}</span>
                    <span>{selectedUser.gender || 'Chưa xác định'}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '20px', background: '#f9fafb', padding: '16px', borderRadius: '12px' }}>
                <div style={{ fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Tiểu sử:</div>
                <div style={{ color: '#4b5563', fontSize: '0.92rem' }}>{selectedUser.bio || 'Chưa có tiểu sử'}</div>
              </div>

              <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.88rem' }}>
                <div><strong>Ngày tạo:</strong> {formatDate(selectedUser.createdAt)}</div>
                <div><strong>Hoạt động gần nhất:</strong> {formatDate(selectedUser.lastActiveAt)}</div>
                <div><strong>Số điện thoại:</strong> {selectedUser.phoneNumber || 'Chưa đăng ký'}</div>
                <div><strong>Vai trò:</strong> {selectedUser.role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng'}</div>
                <div><strong>Trạng thái:</strong> <span style={{ color: selectedUser.status === 'BANNED' ? '#ef4444' : '#10b981' }}>{selectedUser.status === 'BANNED' ? 'Đã bị khóa' : 'Đang hoạt động'}</span></div>
              </div>

              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                {selectedUser.role !== 'ADMIN' && (
                  <button
                    style={{
                      padding: '8px 16px', borderRadius: '8px', border: 'none', color: '#fff', fontWeight: '600', cursor: 'pointer',
                      backgroundColor: selectedUser.status === 'BANNED' ? '#10b981' : '#ef4444', marginRight: '10px'
                    }}
                    onClick={() => handleToggleBan(selectedUser)}
                  >
                    {selectedUser.status === 'BANNED' ? 'Mở khóa tài khoản này' : 'Khóa tài khoản này'}
                  </button>
                )}
                <button
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}
                  onClick={() => setSelectedUser(null)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
        <ToastNotification toast={toast} onClose={() => setToast(null)} />
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999, padding: '20px',
  },
  container: {
    backgroundColor: '#ffffff', borderRadius: '20px',
    width: '1000px', maxWidth: '95vw', maxHeight: '90vh',
    display: 'flex', flexDirection: 'column',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
    overflow: 'hidden',
  },
  header: {
    padding: '18px 24px', borderBottom: '1px solid #f3f4f6',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  closeBtn: {
    background: 'none', border: 'none', fontSize: '1.2rem',
    cursor: 'pointer', color: '#6b7280', padding: '4px 8px', borderRadius: '6px',
  },
  content: {
    padding: '24px', overflowY: 'auto', flex: 1,
  },
  alert: {
    margin: '16px 24px 0 24px', padding: '12px 16px', background: '#fee2e2',
    color: '#991b1b', borderRadius: '8px', fontSize: '0.9rem',
  },
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px', marginBottom: '24px',
  },
  statCard: {
    backgroundColor: '#f9fafb', padding: '16px 20px', borderRadius: '12px',
  },
  statNumber: {
    fontSize: '1.8rem', fontWeight: '700', color: '#1f2937', lineHeight: '1.2',
  },
  statLabel: {
    fontSize: '0.85rem', color: '#6b7280', marginTop: '4px',
  },
  searchBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '16px', gap: '16px',
  },
  searchInput: {
    padding: '10px 16px', borderRadius: '10px', border: '1px solid #d1d5db',
    width: '360px', fontSize: '0.9rem', outline: 'none',
  },
  tableWrapper: {
    border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden',
  },
  table: {
    width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left',
  },
  th: {
    backgroundColor: '#f9fafb', padding: '12px 16px', fontWeight: '600',
    color: '#4b5563', borderBottom: '1px solid #e5e7eb',
  },
  tr: {
    borderBottom: '1px solid #f3f4f6', transition: 'background 0.2s',
  },
  td: {
    padding: '12px 16px', verticalAlign: 'middle',
  },
  avatar: {
    width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover',
  },
  viewBtn: {
    padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db',
    background: '#ffffff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500',
  },
  banBtn: {
    padding: '6px 12px', borderRadius: '6px', border: 'none',
    color: '#ffffff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600',
  },
  nestedBackdrop: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
  },
  nestedModal: {
    backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px',
    width: '560px', maxWidth: '90vw', maxHeight: '85vh', overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
};
