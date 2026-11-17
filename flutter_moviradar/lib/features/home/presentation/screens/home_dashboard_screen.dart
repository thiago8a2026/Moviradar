import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_theme.dart';
import '../../auth/presentation/bloc/auth_bloc.dart';
import '../../auth/presentation/bloc/auth_event.dart';
import '../../auth/presentation/screens/welcome_screen.dart';
import '../../maps/presentation/screens/osm_map_view.dart';
import '../../reports/domain/models/mobility_report_model.dart';
import '../../reports/presentation/widgets/new_report_sheet.dart';

class HomeDashboardScreen extends StatefulWidget {
  const HomeDashboardScreen({super.key});

  @override
  State<HomeDashboardScreen> createState() => _HomeDashboardScreenState();
}

class _HomeDashboardScreenState extends State<HomeDashboardScreen> {
  int _currentTab = 1; // El mapa es el protagonista, seleccionado por defecto

  // Lista local de reportes ciudadanos sobre OpenStreetMap
  final List<MobilityReportModel> _reports = [
    MobilityReportModel(
      id: 'rep_1',
      type: ReportType.accident,
      title: 'Choque múltiple carril central',
      description: 'Dos vehículos colisionados generando reducción a un solo carril.',
      locationName: 'Av. Insurgentes Sur y Eje 6',
      latitude: 19.4342,
      longitude: -99.1350,
      timestamp: DateTime.now().subtract(const Duration(minutes: 6)),
      authorId: 'usr_1',
      authorName: 'Carlos M.',
      confirmationsCount: 14,
    ),
    MobilityReportModel(
      id: 'rep_2',
      type: ReportType.construction,
      title: 'Obras de reencarpetado',
      description: 'Carriles derechos cerrados por mantenimiento de asfalto.',
      locationName: 'Paseo de la Reforma altura Glorieta',
      latitude: 19.4280,
      longitude: -99.1410,
      timestamp: DateTime.now().subtract(const Duration(minutes: 18)),
      authorId: 'usr_2',
      authorName: 'Elena R.',
      confirmationsCount: 22,
    ),
    MobilityReportModel(
      id: 'rep_3',
      type: ReportType.hazard,
      title: 'Bache profundo peligroso',
      description: 'Bache con agua en carril de baja velocidad.',
      locationName: 'Viaducto Miguel Alemán km 8',
      latitude: 19.4305,
      longitude: -99.1290,
      timestamp: DateTime.now().subtract(const Duration(minutes: 32)),
      authorId: 'usr_3',
      authorName: 'Rodrigo T.',
      confirmationsCount: 8,
    ),
  ];

  void _openNewReportModal() {
    final mapBlocState = context.read<MapBloc>().state;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => NewReportSheet(
        currentLatitude: mapBlocState.userLocation.latitude,
        currentLongitude: mapBlocState.userLocation.longitude,
        onSubmit: (newReport) {
          setState(() {
            _reports.insert(0, newReport);
            _currentTab = 1; // Volver al mapa para ver el reporte
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Reporte publicado en el mapa OpenStreetMap.'),
              backgroundColor: AppColors.primaryDark,
            ),
          );
        },
      ),
    );
  }

  void _showReportDetails(MobilityReportModel report) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          padding: const EdgeInsets.all(20),
          decoration: const BoxDecoration(
            color: AppColors.surfaceDark,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      report.type.displayName.toUpperCase(),
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  Text(
                    '${report.confirmationsCount} confirmaciones',
                    style: const TextStyle(color: AppColors.textSecondaryDark, fontSize: 12),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                report.title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                report.description,
                style: const TextStyle(fontSize: 13, color: AppColors.textSecondaryDark),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(Icons.location_on, size: 14, color: AppColors.primaryLight),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      report.locationName,
                      style: const TextStyle(fontSize: 12, color: Colors.white70),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        setState(() {
                          final idx = _reports.indexWhere((r) => r.id == report.id);
                          if (idx != -1) {
                            _reports[idx] = _reports[idx].copyWith(
                              confirmationsCount: _reports[idx].confirmationsCount + 1,
                            );
                          }
                        });
                        Navigator.pop(ctx);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('¡Gracias por confirmar! Tu voto ayuda a la comunidad.'),
                            backgroundColor: AppColors.primaryDark,
                          ),
                        );
                      },
                      icon: const Icon(Icons.thumb_up, size: 16),
                      label: const Text('Confirmar Novedad'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = context.watch<AuthBloc>().state;
    final userName = authState.user?.displayName ?? 'Ciudadano';

    return Scaffold(
      backgroundColor: AppColors.backgroundDark,
      appBar: AppBar(
        backgroundColor: AppColors.surfaceDark,
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.2),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.radar, color: AppColors.primary, size: 20),
            ),
            const SizedBox(width: 10),
            const Text(
              'MoviRadar',
              style: TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 20,
                color: Colors.white,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: AppColors.textSecondaryDark),
            tooltip: 'Cerrar sesión',
            onPressed: () {
              context.read<AuthBloc>().add(LogoutEvent());
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const WelcomeScreen()),
                (route) => false,
              );
            },
          ),
        ],
      ),
      body: _buildCurrentTab(userName),
      // Barra inferior con las 5 secciones solicitadas: Inicio, Mapa, Reportar, Notificaciones, Perfil
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentTab,
        onDestinationSelected: (idx) {
          if (idx == 2) {
            // El tab "Reportar" abre el formulario de registro de novedades
            _openNewReportModal();
          } else {
            setState(() => _currentTab = idx);
          }
        },
        backgroundColor: AppColors.surfaceDark,
        indicatorColor: AppColors.primary.withOpacity(0.2),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home, color: AppColors.primary),
            label: 'Inicio',
          ),
          NavigationDestination(
            icon: Icon(Icons.map_outlined),
            selectedIcon: Icon(Icons.map, color: AppColors.primary),
            label: 'Mapa',
          ),
          NavigationDestination(
            icon: Icon(Icons.add_circle_outline),
            selectedIcon: Icon(Icons.add_circle, color: AppColors.primary),
            label: 'Reportar',
          ),
          NavigationDestination(
            icon: Icon(Icons.notifications_none),
            selectedIcon: Icon(Icons.notifications, color: AppColors.primary),
            label: 'Notificaciones',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person, color: AppColors.primary),
            label: 'Perfil',
          ),
        ],
      ),
    );
  }

  Widget _buildCurrentTab(String userName) {
    switch (_currentTab) {
      case 0:
        return _buildInicioTab(userName);
      case 1:
        // Mapa como protagonista principal (OpenStreetMap a pantalla completa)
        return OsmMapView(
          reports: _reports,
          onReportTap: _showReportDetails,
          onNewReportTap: _openNewReportModal,
        );
      case 2:
        return const SizedBox();
      case 3:
        return _buildNotificacionesTab();
      case 4:
        return _buildPerfilTab(userName);
      default:
        return OsmMapView(
          reports: _reports,
          onReportTap: _showReportDetails,
          onNewReportTap: _openNewReportModal,
        );
    }
  }

  Widget _buildInicioTab(String userName) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            '¡Hola, $userName!',
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          const SizedBox(height: 6),
          const Text(
            'Estado de la movilidad en tu ciudad en tiempo real.',
            style: TextStyle(color: AppColors.textSecondaryDark, fontSize: 14),
          ),
          const SizedBox(height: 20),

          // Tarjeta rápida hacia el Mapa
          InkWell(
            onTap: () => setState(() => _currentTab = 1),
            borderRadius: BorderRadius.circular(20),
            child: Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF064E3B), Color(0xFF0F172A)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.primary.withOpacity(0.4)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.2),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.map, color: AppColors.primary, size: 28),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Abrir Mapa OpenStreetMap',
                          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 16),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Ver novedades de tráfico cercanas con GPS en vivo',
                          style: TextStyle(color: Colors.white70, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.arrow_forward_ios, color: AppColors.primaryLight, size: 16),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Estadísticas cívicas
          const Text(
            'Resumen del Radar',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceDark,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.borderDark),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('${_reports.length}', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.primary)),
                      const SizedBox(height: 4),
                      const Text('Novedades activas', style: TextStyle(color: AppColors.textSecondaryDark, fontSize: 12)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceDark,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.borderDark),
                  ),
                  child: const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('100%', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.radarCyan)),
                      SizedBox(height: 4),
                      Text('Plan Spark Gratuito', style: TextStyle(color: AppColors.textSecondaryDark, fontSize: 12)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildNotificacionesTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _reports.length,
      itemBuilder: (context, i) {
        final rep = _reports[i];
        return Card(
          color: AppColors.surfaceDark,
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: AppColors.borderDark),
          ),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: AppColors.primary.withOpacity(0.15),
              child: const Icon(Icons.notifications_active, color: AppColors.primary, size: 20),
            ),
            title: Text(rep.title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
            subtitle: Text('${rep.locationName} · ${rep.type.displayName}', style: const TextStyle(color: AppColors.textSecondaryDark, fontSize: 12)),
            trailing: Text('${rep.confirmationsCount} votos', style: const TextStyle(color: AppColors.primaryLight, fontSize: 11)),
            onTap: () {
              setState(() => _currentTab = 1);
            },
          ),
        );
      },
    );
  }

  Widget _buildPerfilTab(String userName) {
    final user = context.watch<AuthBloc>().state.user;

    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: CircleAvatar(
              radius: 40,
              backgroundColor: AppColors.primary.withOpacity(0.2),
              child: const Icon(Icons.person, size: 44, color: AppColors.primary),
            ),
          ),
          const SizedBox(height: 14),
          Text(
            userName,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          Text(
            user?.email ?? 'usuario@moviradar.app',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 13, color: AppColors.textSecondaryDark),
          ),
          const SizedBox(height: 24),

          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surfaceDark,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.borderDark),
            ),
            child: Column(
              children: [
                _buildProfileRow(Icons.shield, 'Reputación Cívica', '${user?.reputationScore ?? 100} pts'),
                const Divider(color: AppColors.borderDark),
                _buildProfileRow(Icons.verified_user, 'Plan', 'Firebase Spark (0 costo)'),
                const Divider(color: AppColors.borderDark),
                _buildProfileRow(Icons.map, 'Mapas', 'OpenStreetMap'),
              ],
            ),
          ),
          const Spacer(),

          OutlinedButton.icon(
            onPressed: () {
              context.read<AuthBloc>().add(LogoutEvent());
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const WelcomeScreen()),
                (route) => false,
              );
            },
            icon: const Icon(Icons.logout, color: Colors.redAccent),
            label: const Text('Cerrar Sesión', style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.primary),
          const SizedBox(width: 12),
          Text(label, style: const TextStyle(color: AppColors.textSecondaryDark, fontSize: 13)),
          const Spacer(),
          Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
        ],
      ),
    );
  }
}
