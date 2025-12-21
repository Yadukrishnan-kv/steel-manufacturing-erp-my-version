import 'package:equatable/equatable.dart';

abstract class QCEvent extends Equatable {
  const QCEvent();

  @override
  List<Object> get props => [];
}

class QCLoadDashboard extends QCEvent {}

class QCLoadChecklists extends QCEvent {}

class QCLoadHistory extends QCEvent {}

class QCSubmitChecklist extends QCEvent {
  final Map<String, dynamic> checklistData;

  const QCSubmitChecklist(this.checklistData);

  @override
  List<Object> get props => [checklistData];
}