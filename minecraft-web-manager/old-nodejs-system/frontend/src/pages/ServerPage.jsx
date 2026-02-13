import ServerControl from '../components/server/ServerControl';
import ServerStatus from '../components/server/ServerStatus';
import LogViewer from '../components/server/LogViewer';

export default function ServerPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Servidor Minecraft</h1>
        <p className="text-gray-400 mt-2">
          Control y monitoreo del servidor Paper
        </p>
      </div>

      <ServerStatus />
      <ServerControl />
      <LogViewer />
    </div>
  );
}
