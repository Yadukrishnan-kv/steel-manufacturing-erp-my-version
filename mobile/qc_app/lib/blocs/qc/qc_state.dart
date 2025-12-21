import 'package:equatable/equatable.dart';

abstract class QCState extends Equatable {
  const QCState();

  @override
  List<Object> get props => [];
}

class QCInitial extends QCState {}

class QCLoading extends QCState {}

class QCDashboardLoaded extends QCState {
  final Map<String, dynamic> stats;

  const QCDashboardLoaded(this.stats);

  @override
  List<Object> get props => [stats];
}

class QCChecklistsLoaded extends QCState {
  final List<Map<String, dynamic>> checklists;

  const QCChecklistsLoaded(this.checklists);

  @override
  List<Object> get props => [checklists];
}

class QCHistoryLoaded extends QCState {
  final List<Map<String, dynamic>> history;

  const QCHistoryLoaded(this.history);

  @override
  List<Object> get props => [history];
}

class QCChecklistSubmitted extends QCState {
  final Map<String, dynamic> result;

  const QCChecklistSubmitted(this.result);

  @override
  List<Object> get props => [result];
}

class QCError extends QCState {
  final String message;

  const QCError(this.message);

  @override
  List<Object> get props => [message];
}