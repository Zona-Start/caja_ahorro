interface RefreshTokenInterface {
  access_token: string;
  access_expire_in: number;
  refresh_token: string;
  refresh_expire_in: number;
}

export default RefreshTokenInterface;
