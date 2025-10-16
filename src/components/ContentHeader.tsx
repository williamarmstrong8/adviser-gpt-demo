import { useState, useEffect } from 'react';
import {
    ChevronDown,
    LogOut,
    UserRound,
    User,
    Settings,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';

export function ContentHeader() {
    const navigate = useNavigate();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const { profile } = useUserProfile();

    const handleLogout = () => {
        // Add logout logic here
        console.log('Logging out...');
        setIsUserMenuOpen(false);
    };

    const handleProfileClick = () => {
        navigate('/profile');
        setIsUserMenuOpen(false);
    };

    const handleFirmSettingsClick = () => {
        navigate('/firm-settings');
        setIsUserMenuOpen(false);
    };

    return (
        <div className="flex w-full items-center justify-end">
            <Popover open={isUserMenuOpen} onOpenChange={setIsUserMenuOpen}>
                <PopoverTrigger asChild>
                <div className="h-8 px-2 rounded-md">
                    <Button variant="ghost" size="sm" className="flex items-center gap-2 text-sidebar-foreground">
                        <div className="avatar">
                            {profile.avatar ? (
                                <img
                                    key={profile.avatar.substring(0, 50)} // Force re-render when avatar changes
                                    src={profile.avatar}
                                    alt="Profile"
                                    className="w-4 h-4 rounded-full object-cover"
                                />
                            ) : (
                                <UserRound className="w-4 h-4" />
                            )}
                        </div>
                        <ChevronDown className="w-4 h-4" />
                    </Button>
                </div>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1" align="end" side="top">
                    <div className="space-y-1">
                        <div 
                            className="flex items-center gap-2 p-2 hover:bg-sidebar-primary/10 rounded cursor-pointer"
                            onClick={handleProfileClick}
                        >
                            <User className="w-4 h-4" />
                            <span className="text-sm">Profile</span>
                        </div>
                        <div 
                            className="flex items-center gap-2 p-2 hover:bg-sidebar-primary/10 rounded cursor-pointer"
                            onClick={handleFirmSettingsClick}
                        >
                            <Settings className="w-4 h-4" />
                            <span className="text-sm">Firm Settings</span>
                        </div>
                        <div className="border-t border-border my-1"></div>
                        <div 
                            className="flex items-center gap-2 p-2 hover:bg-sidebar-primary/10 rounded cursor-pointer text-destructive"
                            onClick={handleLogout}
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm">Logout</span>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
