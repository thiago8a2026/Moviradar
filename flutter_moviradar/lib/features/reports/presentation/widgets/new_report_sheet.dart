import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../domain/models/mobility_report_model.dart';

class NewReportSheet extends StatefulWidget {
  final double currentLatitude;
  final double currentLongitude;
  final Function(MobilityReportModel) onSubmit;

  const NewReportSheet({
    super.key,
    required this.currentLatitude,
    required this.currentLongitude,
    required this.onSubmit,
  });

  @override
  State<NewReportSheet> createState() => _NewReportSheetState();
}

class _NewReportSheetState extends State<NewReportSheet> {
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _locationController = TextEditingController();
  ReportType _selectedType = ReportType.congestion;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _locationController.text = 'Ubicación GPS actual';
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  void _handleSubmit() {
    if (_titleController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Por favor escribe un título o breve resumen del reporte.'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final report = MobilityReportModel(
      id: 'rep_${DateTime.now().millisecondsSinceEpoch}',
      type: _selectedType,
      title: _titleController.text.trim(),
      description: _descriptionController.text.trim().isEmpty
          ? 'Reporte verificado por ciudadano en ruta.'
          : _descriptionController.text.trim(),
      locationName: _locationController.text.trim(),
      latitude: widget.currentLatitude,
      longitude: widget.currentLongitude,
      timestamp: DateTime.now(),
      authorId: 'usr_citizen',
      authorName: 'Ciudadano MoviRadar',
      confirmationsCount: 1,
    );

    widget.onSubmit(report);
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      decoration: const BoxDecoration(
        color: AppColors.surfaceDark,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.borderDark,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),

            const Text(
              'Reportar Novedad de Movilidad',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Tu reporte alertará a los conductores cercanos en OpenStreetMap.',
              style: TextStyle(fontSize: 13, color: AppColors.textSecondaryDark),
            ),
            const SizedBox(height: 20),

            // Tipos de novedad (7 categorías requeridas)
            const Text(
              'Tipo de Novedad',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 10),

            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: ReportType.values.map((type) {
                final isSelected = _selectedType == type;
                return ChoiceChip(
                  label: Text(
                    type.displayName,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      color: isSelected ? Colors.black : Colors.white,
                    ),
                  ),
                  selected: isSelected,
                  selectedColor: AppColors.primary,
                  backgroundColor: AppColors.surfaceCardDark,
                  side: BorderSide(
                    color: isSelected ? AppColors.primary : AppColors.borderDark,
                  ),
                  onSelected: (selected) {
                    if (selected) setState(() => _selectedType = type);
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 18),

            // Título
            const Text(
              'Título o Resumen',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 6),
            TextField(
              controller: _titleController,
              style: const TextStyle(color: Colors.white, fontSize: 14),
              decoration: const InputDecoration(
                hintText: 'Ej. Choque en carril izquierdo',
              ),
            ),
            const SizedBox(height: 14),

            // Ubicación
            const Text(
              'Ubicación / Calle',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 6),
            TextField(
              controller: _locationController,
              style: const TextStyle(color: Colors.white, fontSize: 14),
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.location_on_outlined, color: AppColors.primary),
              ),
            ),
            const SizedBox(height: 14),

            // Descripción detallada
            const Text(
              'Detalles de la situación',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 6),
            TextField(
              controller: _descriptionController,
              maxLines: 2,
              style: const TextStyle(color: Colors.white, fontSize: 14),
              decoration: const InputDecoration(
                hintText: 'Indica si hay desvíos o paso bloqueado...',
              ),
            ),
            const SizedBox(height: 24),

            // Botón de Enviar
            ElevatedButton(
              onPressed: _isSubmitting ? null : _handleSubmit,
              child: _isSubmitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                    )
                  : const Text('Publicar Reporte en el Radar'),
            ),
          ],
        ),
      ),
    );
  }
}
