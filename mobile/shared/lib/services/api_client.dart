import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/auth_response.dart';
import '../models/api_response.dart';

part 'api_client.g.dart';

@RestApi()
abstract class ApiClient {
  factory ApiClient(Dio dio, {String baseUrl}) = _ApiClient;

  // Authentication endpoints
  @POST('/api/auth/login')
  Future<AuthResponse> login(@Body() Map<String, dynamic> credentials);

  @POST('/api/auth/logout')
  Future<Map<String, dynamic>> logout();

  @GET('/api/auth/me')
  Future<ApiResponse<Map<String, dynamic>>> getCurrentUser();

  // Generic GET request
  @GET('{path}')
  Future<ApiResponse<Map<String, dynamic>>> get(@Path() String path);

  // Generic POST request
  @POST('{path}')
  Future<ApiResponse<Map<String, dynamic>>> post(
    @Path() String path,
    @Body() Map<String, dynamic> data,
  );

  // Generic PUT request
  @PUT('{path}')
  Future<ApiResponse<Map<String, dynamic>>> put(
    @Path() String path,
    @Body() Map<String, dynamic> data,
  );

  // Generic DELETE request
  @DELETE('{path}')
  Future<Map<String, dynamic>> delete(@Path() String path);
}