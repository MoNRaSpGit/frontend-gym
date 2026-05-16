import "./styles/gym-home.css";
import { GymCheckinTab } from "./components/GymCheckinTab";
import { GymCollectionsTab } from "./components/GymCollectionsTab";
import { GymHeader } from "./components/GymHeader";
import { GymMemberModal } from "./components/GymMemberModal";
import { GymPanelTab } from "./components/GymPanelTab";
import { useGymDemo } from "./hooks/useGymDemo";

export function GymHomePage() {
  const gym = useGymDemo();

  return (
    <main className="gym-shell">
      <GymHeader
        activeTab={gym.activeTab}
        activeClientsCount={gym.activeClients.length}
        summary={gym.summary}
        collectionsSummary={gym.collectionsSummary}
        onTabChange={gym.setActiveTab}
      />

      {gym.activeTab === "panel" ? (
        <GymPanelTab
          clients={gym.sortedClients}
          upcomingClients={gym.collectionsSummary.dueSoon}
          newClient={gym.newClient}
          onNewClientFieldChange={gym.setNewClientField}
          onAddClient={gym.addClient}
        />
      ) : null}

      {gym.activeTab === "cobros" ? (
        <GymCollectionsTab
          dueToday={gym.collectionsSummary.dueToday}
          movements={gym.movements}
          expandedMovementId={gym.expandedMovementId}
          onSelectClient={gym.setSelectedClientId}
          onQuickPayment={gym.handleQuickPayment}
          onToggleMovement={(movementId) =>
            gym.setExpandedMovementId(gym.expandedMovementId === movementId ? null : movementId)
          }
        />
      ) : null}

      {gym.activeTab === "ingresar" ? (
        <GymCheckinTab
          kioskInput={gym.kioskInput}
          kioskResult={gym.kioskResult}
          kioskMember={gym.kioskMember}
          onAppendDigit={gym.appendDigit}
          onRemoveDigit={gym.removeDigit}
          onClear={gym.clearKiosk}
          onSubmit={gym.handleKioskSubmit}
        />
      ) : null}

      <GymMemberModal client={gym.selectedClient} onClose={() => gym.setSelectedClientId(null)} />
    </main>
  );
}
