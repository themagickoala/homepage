// ============================================
// Inventory UI Component
// ============================================
// Displays items and equipment management

import { useCallback, useEffect, useState } from 'react'
import { InventorySlot, PartyMember, Item } from '../types'
import './InventoryUI.css'

interface InventoryUIProps {
  inventory: InventorySlot[]
  party: PartyMember[]
  gold: number
  onUseItem: (itemId: string, targetId: string) => void
  onEquipItem: (itemId: string, characterId: string) => void
  onUnequipItem: (characterId: string, slot: 'weapon' | 'armor' | 'accessory') => void
  onClose: () => void
}

type Tab = 'items' | 'equipment' | 'key'
type EquipFocus = 'slots' | 'inventory'

const EQUIP_SLOT_LABELS: Record<string, string> = {
  weapon: 'Weapon',
  armor: 'Armor',
  accessory: 'Accessory',
}

export function InventoryUI({
  inventory,
  party,
  gold,
  onUseItem,
  onEquipItem,
  onUnequipItem,
  onClose,
}: InventoryUIProps) {
  const [activeTab, setActiveTab] = useState<Tab>('items')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null)

  // Equipment tab state
  const [equipCharIndex, setEquipCharIndex] = useState(0)
  const [equipFocus, setEquipFocus] = useState<EquipFocus>('slots')
  const [equipSlotIndex, setEquipSlotIndex] = useState(0)
  const [equipInvIndex, setEquipInvIndex] = useState(0)

  const equipSlots: ('weapon' | 'armor' | 'accessory')[] = ['weapon', 'armor', 'accessory']

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

  // Current character for equipment tab
  const equipCharacter = party[equipCharIndex]

  // Filter inventory equipment to show items matching the selected slot type
  const equipmentInventory = inventory.filter((slot) =>
    ['weapon', 'armor', 'accessory'].includes(slot.item.type)
  )

  // Handle item selection (for items/key tabs)
  const handleSelectItem = useCallback(
    (index: number) => {
      setSelectedIndex(index)
      const item = filteredItems[index]?.item
      if (item?.type === 'consumable') {
        setSelectedCharacter(party[0].id)
      }
    },
    [filteredItems, party]
  )

  // Handle using/consuming item
  const handleUseItem = useCallback(() => {
    const item = filteredItems[selectedIndex]?.item
    if (!item || !selectedCharacter) return

    if (item.type === 'consumable') {
      onUseItem(item.id, selectedCharacter)
    }
    setSelectedCharacter(null)
  }, [filteredItems, selectedIndex, selectedCharacter, onUseItem])

  // Handle equipping from equipment tab
  const handleEquipFromInventory = useCallback(() => {
    const item = equipmentInventory[equipInvIndex]?.item
    if (!item || !equipCharacter) return
    onEquipItem(item.id, equipCharacter.id)
  }, [equipmentInventory, equipInvIndex, equipCharacter, onEquipItem])

  // Handle unequipping from equipment tab
  const handleUnequip = useCallback(() => {
    if (!equipCharacter) return
    const slot = equipSlots[equipSlotIndex]
    if (equipCharacter.equipment[slot]) {
      onUnequipItem(equipCharacter.id, slot)
    }
  }, [equipCharacter, equipSlotIndex, onUnequipItem])

  // Get details for the currently focused item
  const getDetailItem = (): Item | null => {
    if (activeTab === 'equipment') {
      if (equipFocus === 'slots') {
        const slot = equipSlots[equipSlotIndex]
        return equipCharacter?.equipment[slot] || null
      } else {
        return equipmentInventory[equipInvIndex]?.item || null
      }
    }
    return filteredItems[selectedIndex]?.item || null
  }

  const detailItem = getDetailItem()

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Equipment tab has its own navigation
      if (activeTab === 'equipment' && !selectedCharacter) {
        switch (e.key) {
          case 'ArrowUp':
            if (equipFocus === 'slots') {
              setEquipSlotIndex((prev) => Math.max(0, prev - 1))
            } else {
              setEquipInvIndex((prev) => Math.max(0, prev - 1))
            }
            break
          case 'ArrowDown':
            if (equipFocus === 'slots') {
              setEquipSlotIndex((prev) => Math.min(equipSlots.length - 1, prev + 1))
            } else {
              setEquipInvIndex((prev) => Math.min(equipmentInventory.length - 1, prev + 1))
            }
            break
          case 'ArrowLeft':
            if (equipFocus === 'inventory') {
              setEquipFocus('slots')
            } else {
              // Switch character
              setEquipCharIndex((prev) => Math.max(0, prev - 1))
            }
            break
          case 'ArrowRight':
            if (equipFocus === 'slots') {
              if (equipmentInventory.length > 0) {
                setEquipFocus('inventory')
              }
            } else {
              // Switch character
              setEquipCharIndex((prev) => Math.min(party.length - 1, prev + 1))
            }
            break
          case 'Enter':
          case ' ':
            if (equipFocus === 'slots') {
              handleUnequip()
            } else {
              handleEquipFromInventory()
            }
            break
          case 'Escape':
            onClose()
            break
          case 'Tab':
            e.preventDefault()
            // Tab switches between characters
            setEquipCharIndex((prev) => (prev + 1) % party.length)
            break
        }
        return
      }

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
    equipFocus,
    equipSlotIndex,
    equipInvIndex,
    equipCharIndex,
    equipmentInventory,
    handleSelectItem,
    handleUseItem,
    handleEquipFromInventory,
    handleUnequip,
    onClose,
  ])

  // Render the equipment tab content
  const renderEquipmentTab = () => (
    <div className="equipment-layout">
      <div className="equipment-left">
        <div className="equip-char-switcher">
          {party.map((member, idx) => (
            <button
              key={member.id}
              className={`equip-char-tab ${idx === equipCharIndex ? 'active' : ''}`}
              onClick={() => setEquipCharIndex(idx)}
            >
              {member.name}
            </button>
          ))}
        </div>

        <div className="equip-slots">
          <h4>Equipped</h4>
          {equipSlots.map((slot, idx) => {
            const equipped = equipCharacter?.equipment[slot]
            const isSelected = equipFocus === 'slots' && idx === equipSlotIndex
            return (
              <div
                key={slot}
                className={`equip-slot-row ${isSelected ? 'selected' : ''} ${equipped ? '' : 'empty-slot'}`}
                onClick={() => {
                  setEquipFocus('slots')
                  setEquipSlotIndex(idx)
                }}
                onDoubleClick={() => {
                  if (equipped) {
                    setEquipSlotIndex(idx)
                    handleUnequip()
                  }
                }}
              >
                <span className="slot-label">{EQUIP_SLOT_LABELS[slot]}</span>
                <span className="slot-item">{equipped?.name || '- empty -'}</span>
              </div>
            )
          })}
          {equipFocus === 'slots' && equipCharacter?.equipment[equipSlots[equipSlotIndex]] && (
            <button className="unequip-btn" onClick={handleUnequip}>
              Unequip
            </button>
          )}
        </div>

        <div className="equip-char-stats">
          <div className="stat-row">
            <span>ATK</span>
            <span>{equipCharacter?.stats.attack}</span>
          </div>
          <div className="stat-row">
            <span>DEF</span>
            <span>{equipCharacter?.stats.defense}</span>
          </div>
          <div className="stat-row">
            <span>SPD</span>
            <span>{equipCharacter?.stats.speed}</span>
          </div>
        </div>
      </div>

      <div className="equipment-right">
        <h4>Inventory</h4>
        <div className="equip-inv-list">
          {equipmentInventory.length === 0 ? (
            <div className="empty-message">No equipment</div>
          ) : (
            equipmentInventory.map((slot, index) => (
              <div
                key={slot.item.id}
                className={`item-row ${equipFocus === 'inventory' && index === equipInvIndex ? 'selected' : ''}`}
                onClick={() => {
                  setEquipFocus('inventory')
                  setEquipInvIndex(index)
                }}
                onDoubleClick={() => {
                  setEquipInvIndex(index)
                  handleEquipFromInventory()
                }}
              >
                <span className="item-name">{slot.item.name}</span>
                <span className="item-type-badge">{slot.item.type}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="item-details equip-details">
        {detailItem ? (
          <>
            <h3>{detailItem.name}</h3>
            <p className="item-description">{detailItem.description}</p>
            {detailItem.equipStats && (
              <div className="equip-stats">
                {Object.entries(detailItem.equipStats).map(([stat, value]) => (
                  <div key={stat} className="stat-bonus">
                    {stat}: {value > 0 ? '+' : ''}{value}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="no-selection">
            {equipFocus === 'slots' ? 'Empty slot' : 'Select equipment'}
          </p>
        )}
      </div>
    </div>
  )

  return (
    <div className="inventory-overlay" onClick={onClose}>
      <div className="inventory-panel" onClick={(e) => e.stopPropagation()}>
        <div className="inventory-header">
          <h2>Inventory</h2>
          <span className="gold-display">{gold} Gold</span>
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

        {activeTab === 'equipment' ? (
          renderEquipmentTab()
        ) : (
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
              {detailItem ? (
                <>
                  <h3>{detailItem.name}</h3>
                  <p className="item-description">{detailItem.description}</p>
                  {detailItem.equipStats && (
                    <div className="equip-stats">
                      {Object.entries(detailItem.equipStats).map(([stat, value]) => (
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
        )}

        {selectedCharacter && activeTab !== 'equipment' && (
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
              <button onClick={handleUseItem}>Use</button>
              <button onClick={() => setSelectedCharacter(null)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="inventory-footer">
          {activeTab === 'equipment' ? (
            <span>Tab: Switch character | Enter: Equip/Unequip | ←→ Switch panels | Esc: Close</span>
          ) : (
            <span>↑↓ Select | Enter: Use | ←→ Tabs | Esc: Close</span>
          )}
        </div>
      </div>
    </div>
  )
}
