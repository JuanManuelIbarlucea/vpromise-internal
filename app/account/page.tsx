'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/hooks/useAuth'
import { User, Youtube, Twitch, Mail, Wallet, Loader2, Save, CheckCircle, XCircle } from 'lucide-react'

type AccountData = {
    id: string
    username: string
    email: string | null
    paypalEmail: string | null
    types: string[]
    permission: string
    name: string | null
    talentId: string | null
    managerId: string | null
    youtube: string | null
    twitch: string | null
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AccountPage() {
    const { isAuthenticated, isLoading: authLoading } = useAuth()
    const searchParams = useSearchParams()
    const { data, isLoading, mutate } = useSWR<AccountData>(
        isAuthenticated ? '/api/account' : null,
        fetcher
    )

    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [disconnecting, setDisconnecting] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        paypalEmail: '',
    })

    const connected = searchParams.get('connected')
    const error = searchParams.get('error')

    useEffect(() => {
        if (data) {
            setFormData({
                name: data.name || '',
                email: data.email || '',
                paypalEmail: data.paypalEmail || '',
            })
        }
    }, [data])

    if (authLoading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
        )
    }

    if (!data) return null

    const isTalent = data.types?.includes('TALENT')
    const hasProfile = data.talentId || data.managerId

    const handleSave = async () => {
        setSaving(true)
        setSaved(false)
        try {
            const res = await fetch('/api/account', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })
            if (res.ok) {
                mutate()
                setSaved(true)
                setTimeout(() => setSaved(false), 2000)
            }
        } finally {
            setSaving(false)
        }
    }

    const handleDisconnect = async (platform: 'youtube' | 'twitch') => {
        setDisconnecting(platform)
        try {
            const body = platform === 'youtube'
                ? { disconnectYoutube: true }
                : { disconnectTwitch: true }

            const res = await fetch('/api/account', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            if (res.ok) mutate()
        } finally {
            setDisconnecting(null)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Account</h1>
                <p className="text-muted-foreground">Manage your profile and connected accounts</p>
            </div>

            {connected && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
                    <CheckCircle className="size-4" />
                    Successfully connected {connected === 'youtube' ? 'YouTube' : 'Twitch'}!
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                    <XCircle className="size-4" />
                    Failed to connect account. Please try again.
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="size-5" />
                            Profile
                        </CardTitle>
                        <CardDescription>Your personal information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Username</Label>
                            <div className="text-sm font-medium">{data.username}</div>
                        </div>

                        {hasProfile && (
                            <div className="space-y-2">
                                <Label htmlFor="name">Display Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center gap-2">
                                <Mail className="size-4" />
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="your@email.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="paypalEmail" className="flex items-center gap-2">
                                <Wallet className="size-4" />
                                PayPal Email
                            </Label>
                            <Input
                                id="paypalEmail"
                                type="email"
                                value={formData.paypalEmail}
                                onChange={(e) => setFormData({ ...formData, paypalEmail: e.target.value })}
                                placeholder="your@paypal.com"
                            />
                        </div>

                        <Button onClick={handleSave} disabled={saving} className="w-full">
                            {saving ? (
                                <><Loader2 className="size-4 animate-spin" /> Saving...</>
                            ) : saved ? (
                                <><CheckCircle className="size-4" /> Saved!</>
                            ) : (
                                <><Save className="size-4" /> Save Changes</>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {isTalent && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Youtube className="size-5" />
                                Connected Accounts
                            </CardTitle>
                            <CardDescription>Link your streaming and content platforms</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg border">
                                <div className="flex items-center gap-3">
                                    <Youtube className="size-6 text-red-500" />
                                    <div>
                                        <p className="font-medium">YouTube</p>
                                        {data.youtube ? (
                                            <p className="text-sm text-muted-foreground">Channel: {data.youtube}</p>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">Not connected</p>
                                        )}
                                    </div>
                                </div>
                                {data.youtube ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDisconnect('youtube')}
                                        disabled={disconnecting === 'youtube'}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        {disconnecting === 'youtube' ? <Loader2 className="size-4 animate-spin" /> : 'Disconnect'}
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.location.href = '/api/auth/youtube'}
                                    >
                                        Connect
                                    </Button>
                                )}
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-lg border">
                                <div className="flex items-center gap-3">
                                    <Twitch className="size-6 text-violet-500" />
                                    <div>
                                        <p className="font-medium">Twitch</p>
                                        {data.twitch ? (
                                            <p className="text-sm text-muted-foreground">@{data.twitch}</p>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">Not connected</p>
                                        )}
                                    </div>
                                </div>
                                {data.twitch ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDisconnect('twitch')}
                                        disabled={disconnecting === 'twitch'}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        {disconnecting === 'twitch' ? <Loader2 className="size-4 animate-spin" /> : 'Disconnect'}
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.location.href = '/api/auth/twitch'}
                                    >
                                        Connect
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
