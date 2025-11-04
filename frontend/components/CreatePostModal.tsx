"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { X, Upload } from "lucide-react";
import { postsAPI, accountsAPI } from "@/lib/api";
import Image from "next/image";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onToast?: (type: "success" | "error", message: string) => void;
}

interface FacebookAccount {
  id: number;
  email: string;
  session_exists: boolean;
}

export default function CreatePostModal({
  isOpen,
  onClose,
  onSuccess,
  onToast,
}: CreatePostModalProps) {
  const [accounts, setAccounts] = useState<FacebookAccount[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
  });
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
      // Reset selected accounts when modal opens
      setSelectedAccounts([]);
      setImagePreview("");
    }
  }, [isOpen]);

  const fetchAccounts = async () => {
    try {
      const response = await accountsAPI.list();
      setAccounts(response.data);
    } catch (err) {
      console.error("Failed to fetch accounts:", err);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }

      setImage(file);
      setError("");

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAccountToggle = (accountId: number) => {
    setSelectedAccounts((prev) => {
      if (prev.includes(accountId)) {
        return prev.filter((id) => id !== accountId);
      } else {
        return [...prev, accountId];
      }
    });
  };

  const handleSelectAllAccounts = () => {
    if (selectedAccounts.length === accounts.length) {
      setSelectedAccounts([]);
    } else {
      setSelectedAccounts(accounts.map((acc) => acc.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!formData.description.trim()) {
      setError("Description is required");
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError("Please enter a valid price");
      return;
    }
    if (selectedAccounts.length === 0) {
      setError("Please select at least one account");
      return;
    }
    if (!image) {
      setError("Please upload an image");
      return;
    }

    setLoading(true);

    try {
      // Get current time for scheduled_time
      const now = new Date().toISOString();

      // Create posts for each selected account
      const promises = selectedAccounts.map((accountId) => {
        const submitData = new FormData();
        submitData.append("title", formData.title);
        submitData.append("description", formData.description);
        submitData.append("price", formData.price);
        submitData.append("account_id", accountId.toString());
        submitData.append("scheduled_time", now);
        submitData.append("image", image);
        return postsAPI.create(submitData);
      });

      await Promise.all(promises);

      // Show success message
      if (onToast) {
        const accountText =
          selectedAccounts.length === 1
            ? "1 account"
            : `${selectedAccounts.length} accounts`;
        onToast("success", `Post created successfully for ${accountText}!`);
      }

      // Reset form
      setFormData({
        title: "",
        description: "",
        price: "",
      });
      setSelectedAccounts([]);
      setImage(null);
      setImagePreview("");

      onSuccess();
      onClose();
    } catch (err) {
      const error = err as {
        response?: { data?: { error?: string; detail?: string } };
      };
      let errorMessage = "Failed to create post. Please try again.";

      // Check for specific error messages
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }

      setError(errorMessage);

      if (onToast) {
        onToast("error", errorMessage);
      }
      console.error("Error creating post:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">
            Create Marketplace Post
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Account Selection - Multiple */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-900">
                  Facebook Accounts <span className="text-red-500">*</span>
                </label>
                {accounts.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAllAccounts}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {selectedAccounts.length === accounts.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                )}
              </div>

              {accounts.length === 0 ? (
                <p className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                  No accounts available. Please add an account first.
                </p>
              ) : (
                <div className="border border-gray-300 rounded-lg divide-y divide-gray-200 max-h-48 overflow-y-auto">
                  {accounts.map((account) => (
                    <label
                      key={account.id}
                      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAccounts.includes(account.id)}
                        onChange={() => handleAccountToggle(account.id)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-3 flex-1 text-sm font-medium text-gray-900">
                        {account.email}
                      </span>
                      {account.session_exists ? (
                        <span className="ml-2 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                          ✓ Active
                        </span>
                      ) : (
                        <span className="ml-2 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                          No Session
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              )}

              {selectedAccounts.length > 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  {selectedAccounts.length} account
                  {selectedAccounts.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., iPhone 13 Pro - 256GB"
                className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-400 rounded-lg placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={255}
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                {formData.title.length}/255 characters
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your item in detail..."
                className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-400 rounded-lg placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                {formData.description.length} characters
              </p>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Price ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-400 rounded-lg placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Image <span className="text-red-500">*</span>
              </label>

              {/* File Upload Section */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                {imagePreview && image ? (
                  <div className="space-y-4">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      width={400}
                      height={300}
                      className="max-h-64 mx-auto rounded-lg object-contain"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setImage(null);
                        setImagePreview("");
                      }}
                    >
                      Remove Image
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      PNG, JPG, GIF up to 5MB
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                      aria-label="Upload product image"
                    />
                    <label htmlFor="image-upload">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() =>
                          document.getElementById("image-upload")?.click()
                        }
                      >
                        Select Image
                      </Button>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 mt-6 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || selectedAccounts.length === 0}
              className="flex-1"
            >
              {loading
                ? "Creating..."
                : `Create Post${
                    selectedAccounts.length > 1
                      ? ` (${selectedAccounts.length})`
                      : ""
                  }`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
