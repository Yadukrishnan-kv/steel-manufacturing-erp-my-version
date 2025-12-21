import 'package:flutter_bloc/flutter_bloc.dart';
import 'dart:developer' as developer;
import '../../services/auth_service.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthService _authService;

  AuthBloc(this._authService) : super(AuthInitial()) {
    on<AuthCheckRequested>(_onAuthCheckRequested);
    on<AuthLoginRequested>(_onAuthLoginRequested);
    on<AuthLogoutRequested>(_onAuthLogoutRequested);
  }

  Future<void> _onAuthCheckRequested(
    AuthCheckRequested event,
    Emitter<AuthState> emit,
  ) async {
    developer.log('Checking authentication status', name: 'AuthBloc');
    emit(AuthLoading());
    
    try {
      final isLoggedIn = await _authService.isLoggedIn();
      if (isLoggedIn) {
        final token = _authService.getToken();
        developer.log('User is logged in with token', name: 'AuthBloc');
        emit(AuthAuthenticated(token: token!));
      } else {
        developer.log('User is not logged in', name: 'AuthBloc');
        emit(AuthUnauthenticated());
      }
    } catch (e) {
      developer.log('Auth check error: $e', name: 'AuthBloc');
      emit(AuthUnauthenticated());
    }
  }

  Future<void> _onAuthLoginRequested(
    AuthLoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    developer.log('Login requested for email: ${event.email}', name: 'AuthBloc');
    emit(AuthLoading());
    
    try {
      final result = await _authService.login(event.email, event.password);
      
      developer.log('Login result: ${result['success']}', name: 'AuthBloc');
      
      if (result['success'] == true) {
        developer.log('Login successful, token received', name: 'AuthBloc');
        emit(AuthAuthenticated(
          token: result['token'],
          user: result['user'],
        ));
      } else {
        developer.log('Login failed: ${result['message']}', name: 'AuthBloc');
        emit(AuthError(result['message'] ?? 'Login failed'));
      }
    } catch (e) {
      developer.log('Login exception: $e', name: 'AuthBloc');
      emit(AuthError('Login error: $e'));
    }
  }

  Future<void> _onAuthLogoutRequested(
    AuthLogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    await _authService.logout();
    emit(AuthUnauthenticated());
  }
}