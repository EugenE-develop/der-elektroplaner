import React, { FC, useState, useMemo, useEffect, ChangeEvent } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { SystemSetting } from '../../types';
import { useAdminData, useAdminDataMutations } from '../../hooks/useAdminData';
import { supabase } from '../../supabaseClient';

type FirmendatenFormInputs = {
    company_name: string;
    company_street: string;
    company_zip: string;
    company_city: string;
    company_ceo: string;
    company_prokuristen: string;
    company_tax_id: string;
    company_trade_register: string;
};

const FirmendatenEditor: FC = () => {
    const { data: adminData, isLoading } = useAdminData();
    const { updateSystemSettingsMutation } = useAdminDataMutations();

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const settingsMap = useMemo(() => {
        const map: Record<string, any> = {};
        (adminData?.systemSettings || []).forEach(s => {
            // FIX: Ensure the value is a string or a primitive that can be converted to a string.
            // This prevents React from trying to render an object as the value of an input/textarea.
            if (typeof s.value === 'object' && s.value !== null) {
                // Special handling for prokuristen if it's an array
                if (s.key === 'company_prokuristen' && Array.isArray(s.value)) {
                    map[s.key] = s.value.join('\n');
                } else {
                    // Fallback for other unexpected objects
                    map[s.key] = JSON.stringify(s.value);
                }
            } else {
                map[s.key] = s.value;
            }
        });
        return map;
    }, [adminData?.systemSettings]);

    const { register, handleSubmit, reset, formState: { isDirty } } = useForm<FirmendatenFormInputs>();

    useEffect(() => {
        if (adminData?.systemSettings) {
            reset(settingsMap);
            if(settingsMap.company_logo_url) {
                setLogoPreview(settingsMap.company_logo_url);
            }
        }
    }, [settingsMap, reset, adminData]);

    const handleLogoSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit: SubmitHandler<FirmendatenFormInputs> = async (formData) => {
        setMessage(null);
        let logoUrl = settingsMap.company_logo_url || null;

        if (logoFile) {
            const fileExt = logoFile.name.split('.').pop();
            const filePath = `public/company-logo.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('company_assets')
                .upload(filePath, logoFile, { upsert: true });

            if (uploadError) {
                setMessage({ type: 'error', text: `Fehler beim Hochladen des Logos: ${uploadError.message}` });
                return;
            }
            
            const { data } = supabase.storage.from('company_assets').getPublicUrl(filePath);
            logoUrl = `${data.publicUrl}?t=${new Date().getTime()}`;
        }
        
        const settingsToSave: SystemSetting[] = Object.entries(formData).map(([key, value]) => ({
            key,
            value: value || '',
        }));

        // Special handling for prokuristen to save as array if it contains newlines
        if (formData.company_prokuristen && formData.company_prokuristen.includes('\n')) {
            const prokuristenSetting = settingsToSave.find(s => s.key === 'company_prokuristen');
            if(prokuristenSetting) {
                prokuristenSetting.value = formData.company_prokuristen.split('\n').map(s => s.trim()).filter(Boolean);
            }
        }

        settingsToSave.push({ key: 'company_logo_url', value: logoUrl });

        updateSystemSettingsMutation.mutate(settingsToSave, {
            onSuccess: () => {
                setMessage({ type: 'success', text: 'Firmendaten erfolgreich gespeichert!' });
                setLogoFile(null);
                setTimeout(() => setMessage(null), 3000);
            },
            onError: (error) => {
                setMessage({ type: 'error', text: `Fehler: ${error.message}` });
            },
        });
    };
    
    const commonInputClasses = "w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white transition text-sm";


    if (isLoading) return <p>Lade Firmendaten...</p>;

    return (
        <div className="stammdaten-editor">
            <h3 className="text-lg font-semibold mb-6">Firmendaten</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-medium mb-3">Allgemein</h4>
                        <div className="space-y-4">
                            <div><label className="text-xs font-medium text-text-light mb-1 block">Firmenname</label><input {...register("company_name")} className={commonInputClasses} /></div>
                            <div><label className="text-xs font-medium text-text-light mb-1 block">Geschäftsführer</label><input {...register("company_ceo")} className={commonInputClasses} /></div>
                             <div><label className="text-xs font-medium text-text-light mb-1 block">Prokuristen</label><textarea {...register("company_prokuristen")} rows={2} className={commonInputClasses} placeholder="Ein Prokurist pro Zeile"></textarea></div>
                        </div>
                    </div>
                     <div className="space-y-4">
                        <h4 className="font-medium mb-3">Adresse</h4>
                        <div><label className="text-xs font-medium text-text-light mb-1 block">Straße & Hausnummer</label><input {...register("company_street")} className={commonInputClasses} /></div>
                        <div className="grid grid-cols-3 gap-2">
                             <div className="col-span-1"><label className="text-xs font-medium text-text-light mb-1 block">PLZ</label><input {...register("company_zip")} className={commonInputClasses} /></div>
                             <div className="col-span-2"><label className="text-xs font-medium text-text-light mb-1 block">Stadt</label><input {...register("company_city")} className={commonInputClasses} /></div>
                        </div>
                    </div>
                    <div>
                         <h4 className="font-medium mb-3">Rechtliches</h4>
                        <div className="space-y-4">
                            <div><label className="text-xs font-medium text-text-light mb-1 block">Steuernummer</label><input {...register("company_tax_id")} className={commonInputClasses} /></div>
                            <div><label className="text-xs font-medium text-text-light mb-1 block">Handelsregisternummer</label><input {...register("company_trade_register")} className={commonInputClasses} /></div>
                        </div>
                    </div>
                     <div>
                        <h4 className="font-medium mb-3">Firmenlogo</h4>
                         <div className="flex items-center gap-4">
                            {logoPreview && <img src={logoPreview} alt="Logo Vorschau" className="h-16 w-auto max-w-[150px] object-contain bg-slate-100 p-1 rounded border" />}
                            <label htmlFor="logo-upload" className="cursor-pointer text-sm text-primary font-medium hover:underline">
                                {logoPreview ? 'Logo ändern' : 'Logo hochladen'}
                                <input id="logo-upload" type="file" className="hidden" onChange={handleLogoSelect} accept="image/*" />
                            </label>
                        </div>
                    </div>
                </div>

                {message && <p className={`text-sm mt-4 p-2 rounded text-center ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</p>}

                <div className="flex justify-end pt-4 border-t border-border">
                    <button type="submit" disabled={updateSystemSettingsMutation.isPending || (!isDirty && !logoFile)} className="py-2 px-6 font-medium rounded-md bg-primary text-white hover:bg-primary-hover disabled:bg-primary/50 disabled:cursor-not-allowed">
                        {updateSystemSettingsMutation.isPending ? 'Speichert...' : 'Änderungen speichern'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default FirmendatenEditor;