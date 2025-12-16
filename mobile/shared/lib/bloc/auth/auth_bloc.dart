import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../models/user.dart';
import '../../services/api_client.dart';
import '../../utils/storage_service.dart';

// Events
abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

class AuthLoginRequested extends AuthEvent {
  final String email;
  final String password;

  const AuthLoginRequested({
    required this.email,
    required this.password,
  });

  @override
  List<Object?> get props => [email, password];
}

class AuthLogoutRequested extends AuthEvent {}

class AuthCheckRequested extends AuthEvent {}

// States
abstract class AuthState extends Equatable {
  const AuthState();

  @override
  List<Object?> get props => [];
}

class AuthInitial extends AuthState {}

class AuthLoading extends AuthState {}

class AuthAuthenticated extends AuthState {
  final User user;
  final String token;

  const AuthAuthenticated({
    required this.user,
    required this.token,
  });

  @override
  List<Object?> get props => [user, token];
}

class AuthUnauthenticated extends AuthState {}

class AuthError extends AuthState {
  final String message;

  const AuthError({required this.message});

  @override
  List<Object?> get props => [message];
}

// Bloc
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final ApiClient _apiClient;
  final StorageService _storageService;

  AuthBloc({
    required ApiClient apiClient,
    required StorageService storageService,
  })  : _apiClient = apiClient,
        _storageService = storageService,
        super(AuthInitial()) {
    on<AuthLoginRequested>(_onLoginRequested);
    on<AuthLogoutRequested>(_onLogoutRequested);
    on<AuthCheckRequested>(_onCheckRequested);
  }

  Future<void> _onLoginRequested(
    AuthLoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    
    try {
      final response = await _apiClient.login({
        'email': event.email,
        'password': event.password,
      });

      if (response.success && response.token != null && response.user != null) {
        await _storageService.saveToken(response.token!);
        await _storageService.saveUser(response.user!);
        
        emit(AuthAuthenticated(
          user: response.user!,
          token: response.token!,
        ));
      } else {
        emit(AuthError(message: response.message ?? 'Login failed'));
      }
    } catch (e) {
      emit(AuthError(message: 'Network error: ${e.toString()}'));
    }
  }

  Future<void> _onLogoutRequested(
    AuthLogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    try {
      await _apiClient.logout();
    } catch (e) {
      // Ignore logout API errors
    }
    
    await _storageService.clearToken();
    await _storageService.clearUser();
    emit(AuthUnauthenticated());
  }

  Future<void> _onCheckRequested(
    AuthCheckRequested event,
    Emitter<AuthState> emit,
  ) async {
    final token = await _storageService.getToken();
    final user = await _storageService.getUser();

    if (token != null && user != null) {
      try {
        // Verify token is still valid
        await _apiClient.getCurrentUser();
        emit(AuthAuthenticated(user: user, token: token));
      } catch (e) {
        // Token is invalid, clear storage
        await _storageService.clearToken();
        await _storageService.clearUser();
        emit(AuthUnauthenticated());
      }
    } else {
      emit(AuthUnauthenticated());
    }
  }
}