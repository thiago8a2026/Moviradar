import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../reports/domain/models/mobility_report_model.dart';
import '../bloc/map_bloc.dart';
import '../bloc/map_event.dart';
import '../bloc/map_state.dart';

class OsmMapView extends StatefulWidget {
  final List<MobilityReportModel> reports;
  final Function(MobilityReportModel)? onReportTap;
  final VoidCallback? onNewReportTap;

  const OsmMapView({
    super.key,
    this.reports = const [],
    this.onReportTap,
    this.onNewReportTap,
  });

  @override
  State<OsmMapView> createState() => _OsmMapViewState();
}

class _OsmMapViewState extends State<OsmMapView> {
  final MapController _mapController = MapController();

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<MapBloc, MapState>(
      listener: (context, state) {
        if (state.shouldAnimateCamera) {
          _mapController.move(state.cameraCenter, state.zoomLevel);
        }
      },
      builder: (context, state) {
        return Stack(
          children: [
            // Mapa base con OpenStreetMap mediante flutter_map
            FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: state.cameraCenter,
                initialZoom: state.zoomLevel,
                minZoom: 3.0,
                maxZoom: 18.0,
                onPositionChanged: (position, hasGesture) {
                  if (hasGesture && position.center != null) {
                    context.read<MapBloc>().add(MoveMapCameraEvent(position.center!));
                  }
                },
              ),
              children: [
                // Capa de teselas OpenStreetMap gratuita con User-Agent requerido
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.moviradar.app',
                  maxZoom: 19,
                ),

                // Marcador de Ubicación del Usuario con Radar GPS
                MarkerLayer(
                  markers: [
                    Marker(
                      point: state.userLocation,
                      width: 60,
                      height: 60,
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          Container(
                            width: 52,
                            height: 52,
                            decoration: BoxDecoration(
                              color: AppColors.primary.withOpacity(0.25),
                              shape: BoxShape.circle,
                            ),
                          ),
                          Container(
                            width: 22,
                            height: 22,
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 2.5),
                              boxShadow: const [
                                BoxShadow(
                                  color: Colors.black45,
                                  blurRadius: 6,
                                  spreadRadius: 1,
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.navigation,
                              size: 12,
                              color: Colors.black,
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Marcadores de incidentes ciudadanos en OpenStreetMap
                    ...widget.reports.map((report) {
                      return Marker(
                        point: LatLng(report.latitude, report.longitude),
                        width: 44,
                        height: 44,
                        child: GestureDetector(
                          onTap: () {
                            context.read<MapBloc>().add(SelectReportMarkerEvent(report));
                            if (widget.onReportTap != null) {
                              widget.onReportTap!(report);
                            }
                          },
                          child: Container(
                            decoration: BoxDecoration(
                              color: _getColorForType(report.type),
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 2),
                              boxShadow: const [
                                BoxShadow(
                                  color: Colors.black45,
                                  blurRadius: 5,
                                  offset: Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Icon(
                              _getIconForType(report.type),
                              color: Colors.white,
                              size: 20,
                            ),
                          ),
                        ),
                      );
                    }),
                  ],
                ),

                // Atribución oficial obligatoria de OpenStreetMap
                const RichAttributionWidget(
                  alignment: AttributionAlignment.bottomLeft,
                  attributions: [
                    TextSourceAttribution(
                      '© OpenStreetMap contributors',
                      prependCopyright: false,
                    ),
                  ],
                ),
              ],
            ),

            // Banner superior de estado del GPS (si está desactivado o sin permisos)
            if (state.isGpsDisabledOrDenied && state.errorMessage != null)
              Positioned(
                top: 14,
                left: 14,
                right: 14,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B).withOpacity(0.96),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.warning.withOpacity(0.8)),
                    boxShadow: const [
                      BoxShadow(color: Colors.black38, blurRadius: 10),
                    ],
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.location_off, color: AppColors.warning, size: 22),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          state.errorMessage!,
                          style: const TextStyle(fontSize: 12, color: Colors.white, height: 1.3),
                        ),
                      ),
                      TextButton(
                        onPressed: () {
                          context.read<MapBloc>().add(RequestGpsPermissionEvent());
                        },
                        child: const Text(
                          'Activar',
                          style: TextStyle(color: AppColors.primaryLight, fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            // Controles flotantes en la parte derecha (Zoom in, Zoom out, Centrar GPS)
            Positioned(
              right: 16,
              bottom: 24,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Acercar mapa (+)
                  _buildMapButton(
                    icon: Icons.add,
                    tooltip: 'Acercar mapa',
                    onPressed: () => context.read<MapBloc>().add(const ChangeMapZoomEvent(1.0)),
                  ),
                  const SizedBox(height: 8),

                  // Alejar mapa (-)
                  _buildMapButton(
                    icon: Icons.remove,
                    tooltip: 'Alejar mapa',
                    onPressed: () => context.read<MapBloc>().add(const ChangeMapZoomEvent(-1.0)),
                  ),
                  const SizedBox(height: 12),

                  // Botón de centrado GPS
                  FloatingActionButton(
                    heroTag: 'gps_center_fab',
                    backgroundColor: AppColors.surfaceDark,
                    foregroundColor: AppColors.primary,
                    elevation: 5,
                    onPressed: () => context.read<MapBloc>().add(CenterMapOnUserEvent()),
                    child: state.status == MapStatus.loadingGps
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppColors.primary,
                            ),
                          )
                        : const Icon(Icons.my_location, size: 24),
                  ),
                ],
              ),
            ),

            // Botón grande "+ Reportar Novedad"
            if (widget.onNewReportTap != null)
              Positioned(
                left: 16,
                bottom: 24,
                child: FloatingActionButton.extended(
                  heroTag: 'add_mobility_report_fab',
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.black,
                  elevation: 6,
                  onPressed: widget.onNewReportTap,
                  icon: const Icon(Icons.add_alert, size: 20),
                  label: const Text(
                    'Reportar Novedad',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }

  Widget _buildMapButton({
    required IconData icon,
    required String tooltip,
    required VoidCallback onPressed,
  }) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: AppColors.surfaceDark.withOpacity(0.94),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderDark),
        boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4)],
      ),
      child: IconButton(
        icon: Icon(icon, color: Colors.white, size: 20),
        onPressed: onPressed,
        tooltip: tooltip,
        padding: EdgeInsets.zero,
      ),
    );
  }

  Color _getColorForType(ReportType type) {
    switch (type) {
      case ReportType.accident:
        return const Color(0xFFEF4444);
      case ReportType.congestion:
        return const Color(0xFFF59E0B);
      case ReportType.roadClosed:
        return const Color(0xFFDC2626);
      case ReportType.construction:
        return const Color(0xFFEA580C);
      case ReportType.stalledVehicle:
        return const Color(0xFF8B5CF6);
      case ReportType.hazard:
        return const Color(0xFFF97316);
      case ReportType.other:
        return const Color(0xFF06B6D4);
    }
  }

  IconData _getIconForType(ReportType type) {
    switch (type) {
      case ReportType.accident:
        return Icons.car_crash;
      case ReportType.congestion:
        return Icons.traffic;
      case ReportType.roadClosed:
        return Icons.block;
      case ReportType.construction:
        return Icons.construction;
      case ReportType.stalledVehicle:
        return Icons.build;
      case ReportType.hazard:
        return Icons.warning_amber_rounded;
      case ReportType.other:
        return Icons.info_outline;
    }
  }
}
