import 'package:flutter_bloc/flutter_bloc.dart';
import 'dart:developer' as developer;
import '../../services/qc_service.dart';
import 'qc_event.dart';
import 'qc_state.dart';

class QCBloc extends Bloc<QCEvent, QCState> {
  final QCService _qcService;

  QCBloc(this._qcService) : super(QCInitial()) {
    on<QCLoadDashboard>(_onLoadDashboard);
    on<QCLoadChecklists>(_onLoadChecklists);
    on<QCLoadHistory>(_onLoadHistory);
    on<QCSubmitChecklist>(_onSubmitChecklist);
  }

  Future<void> _onLoadDashboard(
    QCLoadDashboard event,
    Emitter<QCState> emit,
  ) async {
    developer.log('Loading QC dashboard', name: 'QCBloc');
    emit(QCLoading());
    try {
      final stats = await _qcService.getDashboardStats();
      developer.log('Dashboard stats loaded: $stats', name: 'QCBloc');
      emit(QCDashboardLoaded(stats));
    } catch (e) {
      developer.log('Dashboard load error: $e', name: 'QCBloc');
      emit(QCError(e.toString()));
    }
  }

  Future<void> _onLoadChecklists(
    QCLoadChecklists event,
    Emitter<QCState> emit,
  ) async {
    developer.log('Loading QC checklists', name: 'QCBloc');
    emit(QCLoading());
    try {
      final checklists = await _qcService.getQCChecklists();
      developer.log('QC checklists loaded: ${checklists.length} items', name: 'QCBloc');
      emit(QCChecklistsLoaded(checklists));
    } catch (e) {
      developer.log('Checklists load error: $e', name: 'QCBloc');
      emit(QCError(e.toString()));
    }
  }

  Future<void> _onLoadHistory(
    QCLoadHistory event,
    Emitter<QCState> emit,
  ) async {
    developer.log('Loading QC history', name: 'QCBloc');
    emit(QCLoading());
    try {
      final history = await _qcService.getQCHistory();
      developer.log('QC history loaded: ${history.length} items', name: 'QCBloc');
      emit(QCHistoryLoaded(history));
    } catch (e) {
      developer.log('History load error: $e', name: 'QCBloc');
      emit(QCError(e.toString()));
    }
  }

  Future<void> _onSubmitChecklist(
    QCSubmitChecklist event,
    Emitter<QCState> emit,
  ) async {
    developer.log('Submitting QC checklist: ${event.checklistData}', name: 'QCBloc');
    emit(QCLoading());
    try {
      final result = await _qcService.submitQCChecklist(event.checklistData);
      developer.log('QC checklist submitted successfully: $result', name: 'QCBloc');
      emit(QCChecklistSubmitted(result));
    } catch (e) {
      developer.log('Checklist submit error: $e', name: 'QCBloc');
      emit(QCError(e.toString()));
    }
  }
}