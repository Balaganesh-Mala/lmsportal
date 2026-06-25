import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    const defaultSettings = {
        siteTitle: 'Smart Aspirants',
        logoUrl: '',
        contact: {
            phone: '',
            whatsapp: '',
            email: 'info@smartaspirants.com',
            address: 'Smart Aspirants Location'
        },
        socials: {
            facebook: '#',
            instagram: '#',
            linkedin: '#',
            youtube: '#'
        }
    };

    const [settings, setSettings] = useState(defaultSettings);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Todo: Use env var for API URL
                const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/settings`);
                // Only update if we get valid data
                if (res.data) {
                    setSettings(res.data);
                }
            } catch (error) {
                console.error('Error fetching site settings, using defaults:', error);
                // Keep default settings on error
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const value = {
        settings,
        loading,
        getSocialLink: (platform) => settings?.socials?.[platform] || '#',
        getContactInfo: (type) => settings?.contact?.[type] || ''
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};
