// ============================================
// Inventory UI Component
// ============================================
// Displays items and equipment management

import { useCallback, useEffect, useState } from 'react'
import { InventorySlot, PartyMember } from '../types'
import './InventoryUI.css'

interface InventoryUIProps {
  inventory: InventorySlot[]
  party: PartyMember[]
  gold: number
  onUseItem: (itemId: string, targetId: string) => void
  onEquipItem: (itemId: string, characterId: string) => void
  onClose: () => void
}

type Tab = 'items' | 'equipment' | 'key'

export function InventoryUI({
  inventory,
  party,
  gold,
  onUseItem,
  onEquipItem,
  onClose,
}: InventoryUIProps) {
  const [activeTab, setActiveTab] = useState<Tab>('items')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null)

  // Filter inventory by tab
  const filteredItems = inventory.filter((slot) => {
    switch (activeTab) {
      case 'items':
        return slot.item.type === 'consumable'
      case 'equipment':
        return ['weapon', 'armor', 'accessory'].includes(slot.item.type)
      case 'key':
        return slot.item.type === 'key'
      default:
        return true
    }
  })

  // Handle item selection
  const handleSelectItem = useCallback(
    (index: number) => {
      setSelectedIndex(index)
      const item = filteredItems[index]?.item

      if (item?.type === 'consumable') {
        // Show character selection for use
        setSelectedCharacter(party[0].id)
      } else if (['weapon', 'armor', 'accessory'].includes(item?.type || '')) {
        // Show character selection for equip
        setSelectedCharacter(party[0].id)
      }
    },
    [filteredItems, party]
  )

  // Handle using item
  const handleUseItem = useCallback(() => {
    const item = filteredItems[selectedIndex]?.item
    if (!item || !selectedCharacter) return

    if (item.type === 'consumable') {
      onUseItem(item.id, selectedCharacter)
    } else if (['weapon', 'armor', 'accessory'].includes(item.type)) {
      onEquipItem(item.id, selectedCharacter)
    }

    setSelectedCharacter(null)
  }, [filteredItems, selectedIndex, selectedCharacter, onUseItem, onEquipItem])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          setSelectedIndex((prev) => Math.max(0, prev - 1))
          break
        case 'ArrowDown':
          setSelectedIndex((prev) => Math.min(filteredItems.length - 1, prev + 1))
          break
        case 'ArrowLeft':
          if (selectedCharacter) {
            const charIndex = party.findIndex((p) => p.id === selectedCharacter)
            const newIndex = Math.max(0, charIndex - 1)
            setSelectedCharacter(party[newIndex].id)
          } else {
            const tabs: Tab[] = ['items', 'equipment', 'key']
            const currentIndex = tabs.indexOf(activeTab)
            setActiveTab(tabs[Math.max(0, currentIndex - 1)])
            setSelectedIndex(0)
          }
          break
        case 'ArrowRight':
          if (selectedCharacter) {
            const charIndex = party.findIndex((p) => p.id === selectedCharacter)
            const newIndex = Math.min(party.length - 1, charIndex + 1)
            setSelectedCharacter(party[newIndex].id)
          } else {
            const tabs: Tab[] = ['items', 'equipment', 'key']
            const currentIndex = tabs.indexOf(activeTab)
            setActiveTab(tabs[Math.min(tabs.length - 1, currentIndex + 1)])
            setSelectedIndex(0)
          }
          break
        case 'Enter':
        case ' ':
          if (selectedCharacter) {
            handleUseItem()
          } else if (filteredItems.length > 0) {
            handleSelectItem(selectedIndex)
          }
          break
        case 'Escape':
          if (selectedCharacter) {
            setSelectedCharacter(null)
          } else {
            onClose()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    filteredItems,
    selectedIndex,
    selectedCharacter,
    activeTab,
    party,
    handleSelectItem,
    handleUseItem,
    onClose,
  ])

  const selectedItem = filteredItems[selectedIndex]?.item

  return (
    <div className="inventory-overlay" onClick={onClose}>
      <div className="inventory-panel" onClick={(e) => e.stopPropagation()}>
        <div className="inventory-header">
          <h2>Inventory</h2>
          <span className="gold-display">💰 {gold} Gold</span>
        </div>

        <div className="inventory-tabs">
          <button
            className={`tab ${activeTab === 'items' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('items')
              setSelectedIndex(0)
            }}
          >
            Items
          </button>
          <button
            className={`tab ${activeTab === 'equipment' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('equipment')
              setSelectedIndex(0)
            }}
          >
            Equipment
          </button>
          <button
            className={`tab ${activeTab === 'key' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('key')
              setSelectedIndex(0)
            }}
          >
            Key Items
          </button>
        </div>

        <div className="inventory-content">
          <div className="item-list">
            {filteredItems.length === 0 ? (
              <div className="empty-message">No items</div>
            ) : (
              filteredItems.map((slot, index) => (
                <div
                  key={slot.item.id}
                  className={`item-row ${index === selectedIndex ? 'selected' : ''}`}
                  onClick={() => handleSelectItem(index)}
                >
                  <span className="item-name">{slot.item.name}</span>
                  {slot.item.stackable && (
                    <span className="item-quantity">x{slot.quantity}</span>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="item-details">
            {selectedItem ? (
              <>
                <h3>{selectedItem.name}</h3>
                <p className="item-description">{selectedItem.description}</p>
                {selectedItem.equipStats && (
                  <div className="equip-stats">
                    {Object.entries(selectedItem.equipStats).map(([stat, value]) => (
                      <div key={stat} className="stat-bonus">
                        {stat}: {value > 0 ? '+' : ''}{value}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="no-selection">Select an item</p>
            )}
          </div>
        </div>

        {selectedCharacter && (
          <div className="character-select">
            <h3>Select Character</h3>
            <div className="character-list">
              {party.map((member) => (
                <div
                  key={member.id}
                  className={`character-option ${member.id === selectedCharacter ? 'selected' : ''}`}
                  onClick={() => setSelectedCharacter(member.id)}
                >
                  <span className="char-name">{member.name}</span>
                  <div className="char-stats">
                    <span>HP: {member.stats.currentHp}/{member.stats.maxHp}</span>
                    <span>MP: {member.stats.currentMp}/{member.stats.maxMp}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="character-actions">
              <button onClick={handleUseItem}>
                {selectedItem?.type === 'consumable' ? 'Use' : 'Equip'}
              </button>
              <button onClick={() => setSelectedCharacter(null)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="inventory-footer">
          <span>↑↓ Select | Enter: Use/Equip | Esc: Close</span>
        </div>
      </div>
    </div>
  )
}
