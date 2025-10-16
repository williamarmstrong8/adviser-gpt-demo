import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, Home,UserRound, Upload, Settings, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate, Link } from 'react-router-dom';
import { VaultSidebar } from './VaultSidebar';
import { useUserProfile } from '@/hooks/useUserProfile';


export function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { profile, updateProfile, updateAvatar } = useUserProfile();
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    role: profile.role,
    companyName: profile.companyName,
  });

  // Update form data when profile changes
  useEffect(() => {
    setFormData({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      role: profile.role,
      companyName: profile.companyName,
    });
  }, [profile]);

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      updateAvatar(result);
      setIsUploading(false);
      // Clear the file input so the same file can be selected again
      if (event.target) {
        event.target.value = '';
      }
    };
    reader.onerror = () => {
      alert('Error reading file');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    updateAvatar(null);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = () => {
    updateProfile(formData);
    // Force a small delay to ensure the update is processed
    setTimeout(() => {
      alert('Profile saved successfully!');
    }, 100);
  };

  const handleSaveFirmSettings = () => {
    updateProfile({ companyName: formData.companyName });
    alert('Firm settings saved successfully!');
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="h-screen bg-sidebar-background flex gap-4">
      {/* Vault Sidebar */}
      <VaultSidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background mt-4 rounded-tl-2xl vault-scroll">
        <div className="flex-1 overflow-y-auto">

          {/* Header with Breadcrumbs */}
          <div className="border-b border-foreground/10 bg-background">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm mb-6 px-6 pt-6 max-w-[100rem] mx-auto">
              <Link to="/" className="text-foreground/70 hover:text-foreground">
                <Home className="h-4 w-4" />
              </Link>
              <ChevronRight className="h-4 w-4 text-foreground/70" />
              <span className="text-foreground font-medium">
                Profile
              </span>
            </div>

            {/* Main Title */}
            <div className="flex items-center justify-between px-6 pb-6 max-w-[100rem] mx-auto">
              <div>
                <h1 className="text-2xl font-semibold">Manage your profile</h1>
                <p className="text-foreground/70">Manage your account settings and preferences</p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-8">
            <div className="max-w-4xl mx-auto h-full">
              
              <div className="flex flex-col justify-center space-y-12 h-full">
                
                {/* Profile Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Profile information</CardTitle>
                    <CardDescription>
                      Update your profile picture and personal information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                     {/* Avatar Section */}
                     <div className="flex items-center gap-6">
                       <div className="relative">
                         {profile.avatar ? (
                           <div className="relative group">
                             <img
                               key={profile.avatar.substring(0, 50)} // Force re-render when avatar changes
                               src={profile.avatar}
                               alt="Profile"
                               className="w-20 h-20 rounded-full object-cover border-2 border-foreground/10"
                             />
                             <button
                               onClick={handleRemoveAvatar}
                               className="absolute -top-2 -right-2 w-6 h-6 bg-sidebar-accent/10 text-sidebar-accent rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 hover:bg-sidebar-accent/20 transition-opacity"
                             >
                               ×
                             </button>
                           </div>
                         ) : (
                           <div className="w-20 h-20 rounded-full bg-foreground/5 flex items-center justify-center border-2 border-foreground/10">
                             <UserRound className="w-8 h-8 text-foreground" />
                           </div>
                         )}
                       </div>
                       
                       <div className="space-y-2">
                         <div>
                           <Button
                             onClick={handleUploadClick}
                             disabled={isUploading}
                             variant="outline"
                             size="sm"
                             className="flex items-center gap-2"
                           >
                             <Upload className="w-4 h-4" />
                             {isUploading ? 'Uploading...' : profile.avatar ? 'Change Photo' : 'Upload Photo'}
                           </Button>
                         </div>
                         <p className="text-sm text-foreground/70">
                           JPG, PNG or GIF. Max size 5MB.
                         </p>
                       </div>
                     </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />

                     {/* Profile Form */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <Label htmlFor="firstName">First Name</Label>
                         <Input
                           id="firstName"
                           placeholder="Enter your first name"
                           value={formData.firstName}
                           onChange={(e) => handleInputChange('firstName', e.target.value)}
                         />
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor="lastName">Last Name</Label>
                         <Input
                           id="lastName"
                           placeholder="Enter your last name"
                           value={formData.lastName}
                           onChange={(e) => handleInputChange('lastName', e.target.value)}
                         />
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor="email">Email</Label>
                         <Input
                           id="email"
                           type="email"
                           placeholder="Enter your email"
                           value={formData.email}
                           onChange={(e) => handleInputChange('email', e.target.value)}
                         />
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor="role">Role</Label>
                         <Input
                           id="role"
                           placeholder="Enter your role"
                           value={formData.role}
                           onChange={(e) => handleInputChange('role', e.target.value)}
                         />
                       </div>
                       <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input
                          id="companyName"
                          placeholder="Enter company name"
                          value={formData.companyName}
                          onChange={(e) => handleInputChange('companyName', e.target.value)}
                        />
                      </div>
                     </div>

                     <div className="flex justify-end gap-2">
                       <Button variant="outline">Cancel</Button>
                       <Button onClick={handleSaveProfile}>Save Changes</Button>
                     </div>
                  </CardContent>
                </Card>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
