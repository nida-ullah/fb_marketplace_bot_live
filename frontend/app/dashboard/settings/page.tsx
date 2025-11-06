"use client";

import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  User,
  Lock,
  Save,
  Shield,
  LogOut,
  UserCog,
  Check,
  X,
  Key,
  Settings,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { authAPI } from "@/lib/api";
import { useToast, ToastContainer } from "@/components/ui/Toast";

type SettingsTab = "profile" | "security" | "admin";

interface UserData {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_approved: boolean;
  is_staff: boolean;
  is_superuser: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
  });
  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [currentPasswordError, setCurrentPasswordError] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [permissionsData, setPermissionsData] = useState({
    is_staff: false,
    is_superuser: false,
  });
  const { toasts, removeToast, success, error: showError } = useToast();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    router.push("/login");
  };

  // Password validation helper
  const validatePassword = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
      password
    );
    const isLongEnough = password.length >= 8;

    return {
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar,
      isLongEnough,
      isValid:
        hasUpperCase &&
        hasLowerCase &&
        hasNumber &&
        hasSpecialChar &&
        isLongEnough,
    };
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      setProfileData({
        username: response.data.username || "",
        email: response.data.email || "",
        first_name: response.data.first_name || "",
        last_name: response.data.last_name || "",
      });

      // Store current user data
      setCurrentUser({
        id: response.data.id,
        username: response.data.username,
        email: response.data.email,
        first_name: response.data.first_name,
        last_name: response.data.last_name,
        is_approved: response.data.is_approved,
        is_staff: response.data.is_staff,
        is_superuser: response.data.is_superuser,
      });

      // Check if user is admin
      setIsAdmin(response.data.is_staff || response.data.is_superuser || false);
    } catch (err) {
      showError("Failed to load profile");
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await authAPI.getAllUsers();
      setUsers(response.data.users || []);
    } catch (err) {
      showError("Failed to load users");
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleApproveUser = async (userId: number) => {
    try {
      await authAPI.approveUser(userId);
      success("User approved successfully");
      fetchUsers(); // Refresh the list
    } catch (err) {
      showError("Failed to approve user");
      console.error(err);
    }
  };

  const handleDisapproveUser = async (userId: number) => {
    try {
      await authAPI.disapproveUser(userId);
      success("User disapproved successfully");
      fetchUsers(); // Refresh the list
    } catch (err) {
      showError("Failed to disapprove user");
      console.error(err);
    }
  };

  const handleOpenPermissionsModal = (user: UserData) => {
    setSelectedUser(user);
    setPermissionsData({
      is_staff: user.is_staff,
      is_superuser: user.is_superuser,
    });
    setShowPermissionsModal(true);
  };

  const handleUpdatePermissions = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      // You'll need to create this API endpoint
      await authAPI.updateUserPermissions(selectedUser.id, permissionsData);
      success("Permissions updated successfully");
      setShowPermissionsModal(false);
      fetchUsers();
    } catch (err) {
      showError("Failed to update permissions");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResetPasswordModal = (user: UserData) => {
    setSelectedUser(user);
    setNewPassword("");
    setConfirmNewPassword("");
    setShowResetPasswordModal(true);
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    if (newPassword !== confirmNewPassword) {
      showError("Passwords do not match");
      return;
    }

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      showError("Password does not meet requirements");
      return;
    }

    try {
      setLoading(true);
      // You'll need to create this API endpoint
      await authAPI.resetUserPassword(selectedUser.id, newPassword);
      success("Password reset successfully");
      setShowResetPasswordModal(false);
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      showError("Failed to reset password");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserExpansion = (userId: number) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  useEffect(() => {
    if (activeTab === "admin" && isAdmin) {
      fetchUsers();
    }
  }, [activeTab, isAdmin]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authAPI.updateProfile(profileData);
      success("Profile updated successfully!");

      // Update user data in localStorage
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...user,
          ...profileData,
        })
      );
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      showError(error.response?.data?.error || "Failed to update profile");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setCurrentPasswordError(false);

    // Validation
    if (!passwordData.old_password) {
      showError("Please enter your current password");
      return;
    }
    if (!passwordData.new_password) {
      showError("Please enter a new password");
      return;
    }

    // Validate password strength
    const validation = validatePassword(passwordData.new_password);
    if (!validation.isValid) {
      showError("Password must meet all requirements");
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      showError("New passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await authAPI.changePassword(
        passwordData.old_password,
        passwordData.new_password
      );
      success("Password changed successfully!");

      // Clear password fields
      setPasswordData({
        old_password: "",
        new_password: "",
        confirm_password: "",
      });
      setCurrentPasswordError(false);
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      const errorMessage =
        error.response?.data?.error || "Failed to change password";

      // Check if error is about incorrect current password
      if (
        errorMessage.toLowerCase().includes("current password is incorrect") ||
        errorMessage.toLowerCase().includes("old password")
      ) {
        setCurrentPasswordError(true);
      }

      showError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">⚙️ Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Sidebar Layout */}
      <div className="flex gap-6 min-h-[calc(100vh-200px)]">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <Card className="h-full flex flex-col">
            {/* Navigation Section */}
            <CardContent className="p-4 flex-1">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === "profile"
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <User className="h-5 w-5" />
                  <span>Profile Info</span>
                </button>
                <button
                  onClick={() => setActiveTab("security")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === "security"
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Shield className="h-5 w-5" />
                  <span>Security</span>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setActiveTab("admin")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === "admin"
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <UserCog className="h-5 w-5" />
                    <span>Admin Panel</span>
                  </button>
                )}
              </nav>
            </CardContent>

            {/* Account Section at Bottom */}
            <div className="border-t border-gray-200 p-4">
              <div className="mb-3">
                <div className="flex items-center gap-3 px-2 py-2">
                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                    {profileData.username
                      ? profileData.username.charAt(0).toUpperCase()
                      : "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {profileData.first_name && profileData.last_name
                        ? `${profileData.first_name} ${profileData.last_name}`
                        : profileData.username}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {profileData.email}
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full flex items-center justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {activeTab === "profile" && (
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Username */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        value={profileData.username}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            username: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-400 rounded-lg placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            email: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-400 rounded-lg placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    {/* First Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={profileData.first_name}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            first_name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-400 rounded-lg placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={profileData.last_name}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            last_name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-400 rounded-lg placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.old_password}
                      onChange={(e) => {
                        setPasswordData({
                          ...passwordData,
                          old_password: e.target.value,
                        });
                        // Clear error when user starts typing
                        if (currentPasswordError) {
                          setCurrentPasswordError(false);
                        }
                      }}
                      className={`w-full px-3 py-2 text-sm text-gray-900 border rounded-lg placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        currentPasswordError ||
                        (!passwordData.old_password &&
                          (passwordData.new_password ||
                            passwordData.confirm_password))
                          ? "border-red-500"
                          : "border-gray-400"
                      }`}
                      placeholder="Enter current password"
                    />
                    {!passwordData.old_password &&
                      (passwordData.new_password ||
                        passwordData.confirm_password) && (
                        <p className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                          ⚠️ Please enter your current password
                        </p>
                      )}
                    {currentPasswordError && passwordData.old_password && (
                      <p className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        ⚠️ Current password is incorrect. Please try again.
                      </p>
                    )}
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          new_password: e.target.value,
                        })
                      }
                      className={`w-full px-3 py-2 text-sm text-gray-900 border rounded-lg placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        passwordData.new_password &&
                        !validatePassword(passwordData.new_password).isValid
                          ? "border-red-500"
                          : "border-gray-400"
                      }`}
                      placeholder="Enter new password"
                    />
                    {passwordData.new_password &&
                      (() => {
                        const validation = validatePassword(
                          passwordData.new_password
                        );
                        if (!validation.isValid) {
                          return (
                            <div className="mt-2 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 space-y-1">
                              <p className="font-semibold text-red-700 mb-2">
                                ⚠️ Password must contain:
                              </p>
                              <div className="space-y-1">
                                <p
                                  className={
                                    validation.isLongEnough
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }
                                >
                                  {validation.isLongEnough ? "✓" : "✗"} At least
                                  8 characters
                                </p>
                                <p
                                  className={
                                    validation.hasUpperCase
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }
                                >
                                  {validation.hasUpperCase ? "✓" : "✗"} One
                                  uppercase letter (A-Z)
                                </p>
                                <p
                                  className={
                                    validation.hasLowerCase
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }
                                >
                                  {validation.hasLowerCase ? "✓" : "✗"} One
                                  lowercase letter (a-z)
                                </p>
                                <p
                                  className={
                                    validation.hasNumber
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }
                                >
                                  {validation.hasNumber ? "✓" : "✗"} One number
                                  (0-9)
                                </p>
                                <p
                                  className={
                                    validation.hasSpecialChar
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }
                                >
                                  {validation.hasSpecialChar ? "✓" : "✗"} One
                                  special character (!@#$%^&*...)
                                </p>
                              </div>
                            </div>
                          );
                        }
                      })()}
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirm_password: e.target.value,
                        })
                      }
                      className={`w-full px-3 py-2 text-sm text-gray-900 border rounded-lg placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        passwordData.confirm_password &&
                        passwordData.new_password &&
                        passwordData.confirm_password !==
                          passwordData.new_password
                          ? "border-red-500"
                          : "border-gray-400"
                      }`}
                      placeholder="Confirm new password"
                    />
                    {passwordData.confirm_password &&
                      passwordData.new_password &&
                      passwordData.confirm_password !==
                        passwordData.new_password && (
                        <p className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                          ⚠️ Passwords do not match
                        </p>
                      )}
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading}>
                      <Lock className="h-4 w-4 mr-2" />
                      {loading ? "Changing..." : "Change Password"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === "admin" && isAdmin && (
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        No users found
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b-2 border-gray-300">
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                                Username
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                                Email
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                                Name
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.map((user) => (
                              <Fragment key={user.id}>
                                {/* Main User Row - Clickable */}
                                <tr
                                  onClick={() => toggleUserExpansion(user.id)}
                                  className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      {expandedUserId === user.id ? (
                                        <ChevronUp className="h-4 w-4 text-gray-600 flex-shrink-0" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4 text-gray-600 flex-shrink-0" />
                                      )}
                                      <span className="text-sm font-medium text-gray-900">
                                        {user.username}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-sm text-gray-600">
                                    {user.email}
                                  </td>
                                  <td className="py-3 px-4 text-sm text-gray-600">
                                    {user.first_name && user.last_name
                                      ? `${user.first_name} ${user.last_name}`
                                      : "-"}
                                  </td>
                                  <td className="py-3 px-4">
                                    {user.is_approved ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                        <Check className="h-3 w-3" />
                                        Approved
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                                        <X className="h-3 w-3" />
                                        Pending
                                      </span>
                                    )}
                                  </td>
                                </tr>

                                {/* Expanded Actions Row */}
                                {expandedUserId === user.id && (
                                  <tr className="bg-gray-50">
                                    <td colSpan={4} className="p-4">
                                      <div className="space-y-3">
                                        {/* Password Reset - Available to all admins (staff and superuser) */}
                                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                          <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                              <Key className="h-4 w-4 text-purple-600" />
                                            </div>
                                            <div>
                                              <p className="text-sm font-semibold text-gray-900">
                                                Reset Password
                                              </p>
                                              <p className="text-xs text-gray-600">
                                                Set a new password for this user
                                              </p>
                                            </div>
                                          </div>
                                          <Button
                                            onClick={() =>
                                              handleOpenResetPasswordModal(user)
                                            }
                                            size="sm"
                                            className="bg-purple-600 hover:bg-purple-700 text-white"
                                          >
                                            Reset
                                          </Button>
                                        </div>

                                        {/* Permissions - Only visible to superusers */}
                                        {currentUser?.is_superuser && (
                                          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                            <div className="flex items-center gap-3">
                                              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                                <Settings className="h-4 w-4 text-blue-600" />
                                              </div>
                                              <div>
                                                <p className="text-sm font-semibold text-gray-900">
                                                  Manage Permissions
                                                </p>
                                                <p className="text-xs text-gray-600">
                                                  Change staff and superuser
                                                  status
                                                </p>
                                              </div>
                                            </div>
                                            <Button
                                              onClick={() =>
                                                handleOpenPermissionsModal(user)
                                              }
                                              size="sm"
                                              className="bg-blue-600 hover:bg-blue-700 text-white"
                                            >
                                              Edit
                                            </Button>
                                          </div>
                                        )}

                                        {/* Approval - Available to all admins (staff and superuser) */}
                                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                          <div className="flex items-center gap-3">
                                            <div
                                              className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                                                user.is_approved
                                                  ? "bg-red-100"
                                                  : "bg-green-100"
                                              }`}
                                            >
                                              {user.is_approved ? (
                                                <X className="h-4 w-4 text-red-600" />
                                              ) : (
                                                <Check className="h-4 w-4 text-green-600" />
                                              )}
                                            </div>
                                            <div>
                                              <p className="text-sm font-semibold text-gray-900">
                                                {user.is_approved
                                                  ? "Disapprove User"
                                                  : "Approve User"}
                                              </p>
                                              <p className="text-xs text-gray-600">
                                                {user.is_approved
                                                  ? "Revoke user access to the system"
                                                  : "Grant user access to the system"}
                                              </p>
                                            </div>
                                          </div>
                                          {!user.is_approved ? (
                                            <Button
                                              onClick={() =>
                                                handleApproveUser(user.id)
                                              }
                                              size="sm"
                                              className="bg-green-600 hover:bg-green-700 text-white"
                                            >
                                              Approve
                                            </Button>
                                          ) : (
                                            <Button
                                              onClick={() =>
                                                handleDisapproveUser(user.id)
                                              }
                                              size="sm"
                                              className="bg-red-600 hover:bg-red-700 text-white"
                                            >
                                              Disapprove
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Permissions Modal */}
      {showPermissionsModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Change Permissions - {selectedUser.username}
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">Staff Status</h3>
                  <p className="text-sm text-gray-600">
                    Can access admin panel
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={permissionsData.is_staff}
                  onChange={(e) =>
                    setPermissionsData({
                      ...permissionsData,
                      is_staff: e.target.checked,
                    })
                  }
                  className="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Superuser Status
                  </h3>
                  <p className="text-sm text-gray-600">Full system access</p>
                </div>
                <input
                  type="checkbox"
                  checked={permissionsData.is_superuser}
                  onChange={(e) =>
                    setPermissionsData({
                      ...permissionsData,
                      is_superuser: e.target.checked,
                    })
                  }
                  className="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {permissionsData.is_superuser && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ <strong>Warning:</strong> Superuser has full system
                    access including all data and settings.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <Button
                onClick={() => setShowPermissionsModal(false)}
                variant="outline"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdatePermissions}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Reset Password - {selectedUser.username}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter new password"
                />
                {newPassword && (
                  <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      Password Requirements:
                    </p>
                    {(() => {
                      const validation = validatePassword(newPassword);
                      return (
                        <div className="space-y-1 text-xs">
                          <p
                            className={
                              validation.isLongEnough
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {validation.isLongEnough ? "✓" : "✗"} At least 8
                            characters
                          </p>
                          <p
                            className={
                              validation.hasUpperCase
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {validation.hasUpperCase ? "✓" : "✗"} One uppercase
                            (A-Z)
                          </p>
                          <p
                            className={
                              validation.hasLowerCase
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {validation.hasLowerCase ? "✓" : "✗"} One lowercase
                            (a-z)
                          </p>
                          <p
                            className={
                              validation.hasNumber
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {validation.hasNumber ? "✓" : "✗"} One number (0-9)
                          </p>
                          <p
                            className={
                              validation.hasSpecialChar
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {validation.hasSpecialChar ? "✓" : "✗"} One special
                            character
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className={`w-full px-3 py-2 text-sm text-gray-900 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    confirmNewPassword &&
                    newPassword &&
                    confirmNewPassword !== newPassword
                      ? "border-red-500"
                      : "border-gray-400"
                  }`}
                  placeholder="Confirm new password"
                />
                {confirmNewPassword &&
                  newPassword &&
                  confirmNewPassword !== newPassword && (
                    <p className="mt-2 text-sm text-red-600">
                      ⚠️ Passwords do not match
                    </p>
                  )}
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <Button
                onClick={() => setShowResetPasswordModal(false)}
                variant="outline"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleResetPassword}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
