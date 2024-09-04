defmodule StayConnect.Repo.Migrations.AddReleaseBooleans do
  use Ecto.Migration

  def change do
    alter table(:releases) do
      add :is_secret, :boolean, default: false
      add :is_automated, :boolean, default: false
    end
  end
end
