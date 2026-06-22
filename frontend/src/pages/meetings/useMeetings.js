// frontend/src/pages/meetings/useMeetings.js
// Hook custom pour gérer les meetings (fetch, create, delete)

import { useState, useEffect, useCallback } from 'react'
import API_URL from '../../config'

export function useMeetings(token) {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ── Charger tous les meetings ──────────────────────────────────
  const fetchMeetings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/meetings`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Erreur lors du chargement')
      const data = await res.json()
      setMeetings(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { if (token) fetchMeetings() }, [fetchMeetings, token])

  // ── Créer un meeting ───────────────────────────────────────────
  const createMeeting = async (payload) => {
    const res = await fetch(`${API_URL}/api/meetings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Erreur création')
    }
    const newMeeting = await res.json()
    setMeetings((prev) => [...prev, newMeeting])
    return newMeeting
  }

  // ── Toggler "live" ─────────────────────────────────────────────
  const toggleLive = async (id, currentLive) => {
    const res = await fetch(`${API_URL}/api/meetings/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ live: !currentLive }),
    })
    if (!res.ok) throw new Error('Erreur mise à jour')
    const updated = await res.json()
    setMeetings((prev) => prev.map((m) => (m.id === id ? updated : m)))
  }

  // ── Supprimer un meeting ───────────────────────────────────────
  const deleteMeeting = async (id) => {
    const res = await fetch(`${API_URL}/api/meetings/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('Erreur suppression')
    setMeetings((prev) => prev.filter((m) => m.id !== id))
  }

  return { meetings, loading, error, fetchMeetings, createMeeting, toggleLive, deleteMeeting }
}