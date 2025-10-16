import React, { useState } from 'react';
import { ChevronRight, Home, Building, CreditCard, Users, User, Settings, Bot, Plus, Mail, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { VaultSidebar } from '@/components/VaultSidebar';
import { useUserProfile } from '@/hooks/useUserProfile';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Member' | 'Customer Success';
  status: 'active' | 'pending';
  avatar?: string;
}

const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Alex Wright',
    email: 'alex.wright@s2strategy.com',
    role: 'Admin',
    status: 'active',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@s2strategy.com',
    role: 'Member',
    status: 'active',
  },
  {
    id: '3',
    name: 'Mike Chen',
    email: 'mike.chen@s2strategy.com',
    role: 'Customer Success',
    status: 'pending',
  },
];

export function FirmSettings() {
  const { profile } = useUserProfile();
  const [activeTab, setActiveTab] = useState('general');
  const [isBuildingProfile, setIsBuildingProfile] = useState(false);
  const [firmWebsite, setFirmWebsite] = useState('');
  const [firmCrd, setFirmCrd] = useState('');
  const [autoCompleteValue, setAutoCompleteValue] = useState([0.5]);
  const [smartAssistantValue, setSmartAssistantValue] = useState([0.7]);

  const handleBuildProfile = async () => {
    setIsBuildingProfile(true);
    // Simulate API call
    setTimeout(() => {
      setIsBuildingProfile(false);
      alert('Profile built successfully!');
    }, 3000);
  };

  const handleResendInvite = (memberId: string) => {
    console.log('Resending invite for member:', memberId);
    alert('Invite resent successfully!');
  };

  const handleAddTeammate = () => {
    console.log('Adding new teammate');
    alert('Add teammate functionality would open here');
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
                Firm Settings
              </span>
            </div>

            {/* Main Title */}
            <div className="flex items-center justify-between px-6 pb-6 max-w-[100rem] mx-auto">
              <div>
                <h1 className="text-2xl font-semibold">Firm Settings</h1>
                <p className="text-foreground/70">Manage your firm's settings and preferences</p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-8">
            <div className="max-w-4xl mx-auto h-full">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="general" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    General
                  </TabsTrigger>
                  <TabsTrigger value="team" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Team Members
                  </TabsTrigger>
                  <TabsTrigger value="profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Firm Profile
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    AI
                  </TabsTrigger>
                </TabsList>

                {/* General Tab - Subscription & Billing */}
                <TabsContent value="general" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Subscription & Billing
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Subscription */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-medium">Subscription</h3>
                          <p className="text-sm text-foreground/70">Your current plan:</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-sm px-3 py-1">
                            Preview
                          </Badge>
                          <span className="text-sm text-foreground/70">Free trial plan</span>
                        </div>
                      </div>

                      {/* Billing */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-medium">Billing</h3>
                          <p className="text-sm text-foreground/70">Manage your billing information and subscription details</p>
                        </div>
                        <Button className="bg-sidebar-primary hover:bg-sidebar-primary/80">
                          Subscribe to AdviserGPT
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Team Members Tab */}
                <TabsContent value="team" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Team Members</CardTitle>
                          <CardDescription>Manage your team and their access</CardDescription>
                        </div>
                        <Button onClick={handleAddTeammate} className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Add Teammate
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {mockTeamMembers.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-4 border border-foreground/10 rounded-lg hover:bg-foreground/5 transition-colors">
                            <div className="flex items-center gap-4">
                              {member.avatar ? (
                                <img
                                  src={member.avatar}
                                  alt={member.name}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-foreground/10"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center border-2 border-foreground/10">
                                  <User className="w-5 h-5 text-foreground/70" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium">{member.name}</div>
                                <div className="text-sm text-foreground/70">{member.email}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {member.role}
                                  </Badge>
                                  <Badge 
                                    variant={member.status === 'active' ? 'default' : 'secondary'} 
                                    className="text-xs"
                                  >
                                    {member.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            {member.status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResendInvite(member.id)}
                                className="flex items-center gap-2"
                              >
                                <Mail className="h-4 w-4" />
                                Resend Invite
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Firm Profile Tab */}
                <TabsContent value="profile" className="space-y-6 mt-6">
                  {isBuildingProfile ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sidebar-primary mb-4"></div>
                        <h3 className="text-lg font-medium mb-2">Submitting your profile...</h3>
                        <p className="text-foreground/70">This may take a minute.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle>Firm Profile</CardTitle>
                        <CardDescription>Complete your firm's profile information</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <Alert variant="destructive">
                          <AlertDescription>
                            Your profile is incomplete. Please fill out the required information below.
                          </AlertDescription>
                        </Alert>

                        <div className="space-y-6">
                          <div>
                            <Label className="block mb-2" htmlFor="firmWebsite">Firm Website</Label>
                            <Input
                              id="firmWebsite"
                              type="url"
                              value={firmWebsite}
                              onChange={(e) => setFirmWebsite(e.target.value)}
                            />
                            <p className="text-xs mt-1 text-foreground/70">https://example.com</p>
                          </div>

                          <div>
                            <Label className="block mb-2" htmlFor="firmCrd">Firm CRD #</Label>
                            <Input
                              id="firmCrd"
                              value={firmCrd}
                              onChange={(e) => setFirmCrd(e.target.value)}
                            />
                            <p className="text-xs mt-1 text-foreground/70">123456</p>
                          </div>
                        </div>

                        <Button onClick={handleBuildProfile} className="bg-sidebar-primary hover:bg-sidebar-primary/80">
                          Build Profile
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* AI Tab */}
                <TabsContent value="ai" className="space-y-6 mt-6">
                  <Alert variant="info">
                    <AlertDescription>
                      Coming Soon: You will be able to modify your AI settings here. Stay tuned for updates!
                    </AlertDescription>
                  </Alert>

                  <Card>
                    <CardHeader>
                      <CardTitle>Smart Assistant Settings</CardTitle>
                      <CardDescription>Configure your AI assistant preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Auto Complete</Label>
                          <div className="px-3">
                            <Slider
                              value={autoCompleteValue}
                              onValueChange={setAutoCompleteValue}
                              max={1}
                              min={0}
                              step={0.001}
                              className="w-full"
                            />
                          </div>
                          <p className="text-sm text-foreground/70">Current value: {autoCompleteValue[0]}</p>
                        </div>

                        <div className="space-y-2">
                          <Label>Smart Assistant</Label>
                          <div className="px-3">
                            <Slider
                              value={smartAssistantValue}
                              onValueChange={setSmartAssistantValue}
                              max={1}
                              min={0}
                              step={0.01}
                              className="w-full"
                            />
                          </div>
                          <p className="text-sm text-foreground/70">Current value: {smartAssistantValue[0]}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
